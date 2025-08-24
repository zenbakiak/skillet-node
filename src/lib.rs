use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi::{NapiRaw, JsUnknown};
use napi_derive::napi;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::{Mutex, mpsc};
use std::sync::atomic::{AtomicU64, Ordering};

static RESPONDERS: Lazy<Mutex<HashMap<u64, mpsc::Sender<std::result::Result<serde_json::Value, String>>>>> = Lazy::new(|| Mutex::new(HashMap::new()));
static REQ_ID: AtomicU64 = AtomicU64::new(1);

struct CallData {
  id: u64,
  args: serde_json::Value,
}

struct JsCustomFunction {
  name: String,
  min_args: usize,
  max_args: Option<usize>,
  tsfn: ThreadsafeFunction<CallData>,
}

impl skillet::custom::CustomFunction for JsCustomFunction {
  fn name(&self) -> &str { &self.name }
  fn min_args(&self) -> usize { self.min_args }
  fn max_args(&self) -> Option<usize> { self.max_args }
  fn execute(&self, args: Vec<skillet::Value>) -> std::result::Result<skillet::Value, skillet::Error> {
    let json_args = serde_json::Value::Array(args.iter().map(value_to_json).collect());
    let (tx, rx): (mpsc::Sender<std::result::Result<serde_json::Value, String>>, mpsc::Receiver<std::result::Result<serde_json::Value, String>>) = mpsc::channel();
    let id = REQ_ID.fetch_add(1, Ordering::SeqCst);
    {
      let mut map = RESPONDERS.lock().map_err(|_| skillet::Error::new("Responder mutex poisoned", None))?;
      map.insert(id, tx);
    }
    self.tsfn.call(Ok(CallData { id, args: json_args }), ThreadsafeFunctionCallMode::NonBlocking);
    match rx.recv() {
      Ok(Ok(json)) => skillet::json_to_value(json),
      Ok(Err(msg)) => Err(skillet::Error::new(msg, None)),
      Err(_) => Err(skillet::Error::new("JS function did not respond", None)),
    }
  }
}
// Note: JS custom function bridging is not included in this initial version.
// We expose hooks to enable built-in Rust custom functions only.

// Re-export a simple version helper
#[napi]
pub fn version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}

#[napi]
pub fn eval_formula(formula: String) -> Result<serde_json::Value> {
  let value = skillet::evaluate(&formula)
    .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;
  Ok(value_to_json(&value))
}

#[napi]
pub fn eval_formula_with(formula: String, vars: Option<serde_json::Value>) -> Result<serde_json::Value> {
  if let Some(v) = vars {
    let json = serde_json::to_string(&v)
      .map_err(|e| Error::new(Status::InvalidArg, format!("Invalid vars JSON: {}", e)))?;
    let value = skillet::evaluate_with_json(&formula, &json)
      .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;
    Ok(value_to_json(&value))
  } else {
    eval_formula(formula)
  }
}

#[napi]
pub async fn eval_formula_with_custom(formula: String, vars: Option<serde_json::Value>) -> Result<serde_json::Value> {
  let json = if let Some(v) = vars {
    serde_json::to_string(&v).map_err(|e| Error::new(Status::InvalidArg, format!("Invalid vars JSON: {}", e)))?
  } else {
    "{}".to_string()
  };
  let out = napi::tokio::task::spawn_blocking(move || skillet::evaluate_with_json_custom(&formula, &json))
    .await
    .map_err(|e| Error::new(Status::GenericFailure, format!("Join error: {}", e)))?
    .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;
  Ok(value_to_json(&out))
}

// Placeholder for future JS custom function registration.
#[napi]
pub fn register_js_function(name: String, func: JsFunction, min_args: Option<u32>, max_args: Option<u32>) -> Result<()> {
  let tsfn: ThreadsafeFunction<CallData> = func.create_threadsafe_function(0, |ctx| {
    let CallData { id, args } = ctx.value;
    let args_js = ctx.env.to_js_value(&args)?;
    // Create a resolver bound to this id
    let resolver = ctx.env.create_function_from_closure("__skillet_resolve", move |cb_ctx| {
      let val = cb_ctx.get::<JsUnknown>(0)?;
      let json: serde_json::Value = unsafe { serde_json::Value::from_napi_value(cb_ctx.env.raw(), val.raw()) }?;
      if let Ok(mut map) = RESPONDERS.lock() {
        if let Some(sender) = map.remove(&id) {
          let _ = sender.send(Ok(json));
        }
      }
      cb_ctx.env.get_undefined().map(|u| u.into_unknown())
    })?;
    Ok(vec![args_js, resolver.into_unknown()])
  })?;

  let wrapper = JsCustomFunction { name: name.clone(), min_args: min_args.unwrap_or(0) as usize, max_args: max_args.map(|m| m as usize), tsfn };
  skillet::register_function(Box::new(wrapper)).map_err(|e| Error::new(Status::GenericFailure, e.to_string()))
}

#[napi]
pub fn unregister_function(name: String) -> bool { skillet::unregister_function(&name) }

#[napi]
pub fn list_custom_functions() -> Vec<String> { skillet::list_custom_functions() }


fn value_to_json(v: &skillet::Value) -> serde_json::Value {
  use serde_json::{json, Value as J};
  match v {
    skillet::Value::Number(n) => json!(n),
    skillet::Value::Currency(n) => json!(n),
    skillet::Value::Boolean(b) => json!(b),
    skillet::Value::String(s) => json!(s),
    skillet::Value::Null => J::Null,
    skillet::Value::DateTime(ts) => json!(ts),
    skillet::Value::Array(items) => J::Array(items.iter().map(value_to_json).collect()),
    skillet::Value::Json(s) => match serde_json::from_str::<J>(s) {
      Ok(parsed) => parsed,
      Err(_) => json!(s),
    },
  }
}
