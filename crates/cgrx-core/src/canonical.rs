use std::fmt;
use std::path::Path;

use serde::Serialize;
use serde::ser::{
    Error as _, SerializeMap, SerializeSeq, SerializeStruct, SerializeStructVariant,
    SerializeTuple, SerializeTupleStruct, SerializeTupleVariant, Serializer,
};
use serde_json::{Map, Number, Value};

use crate::{CoreError, Hash32};

/// Hashes a recursively key-sorted JSON representation with BLAKE3.
///
/// The input is serialized exactly once. Every string is checked for an
/// absolute path and every floating-point value is rejected.
pub fn canonical_hash<T: Serialize>(value: &T) -> Result<Hash32, CoreError> {
    let json = value.serialize(ValueSerializer).map_err(CoreError::from)?;
    validate_value(&json)?;
    let canonical = sort_json(json);
    let bytes = serde_json::to_vec(&canonical)
        .map_err(|error| CoreError::Serialization(error.to_string()))?;
    Ok(Hash32(*blake3::hash(&bytes).as_bytes()))
}

fn validate_value(value: &Value) -> Result<(), CoreError> {
    match value {
        Value::Number(number) if number.is_f64() => Err(CoreError::FloatingPoint),
        Value::String(path) if is_absolute_path(path) => Err(CoreError::AbsolutePath {
            field: "string".to_owned(),
            path: path.clone(),
        }),
        Value::Array(values) => {
            for value in values {
                validate_value(value)?;
            }
            Ok(())
        }
        Value::Object(entries) => {
            for (key, value) in entries {
                if is_absolute_path(key) {
                    return Err(CoreError::AbsolutePath {
                        field: "object_key".to_owned(),
                        path: key.clone(),
                    });
                }
                validate_value(value)?;
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

fn is_absolute_path(value: &str) -> bool {
    Path::new(value).is_absolute()
        || value.as_bytes().get(..3).is_some_and(|prefix| {
            prefix[0].is_ascii_alphabetic()
                && prefix[1] == b':'
                && matches!(prefix[2], b'/' | b'\\')
        })
        || value.starts_with("\\\\")
}

fn sort_json(value: Value) -> Value {
    match value {
        Value::Array(values) => Value::Array(values.into_iter().map(sort_json).collect()),
        Value::Object(entries) => {
            let mut entries: Vec<_> = entries.into_iter().collect();
            entries.sort_unstable_by(|left, right| left.0.cmp(&right.0));
            Value::Object(
                entries
                    .into_iter()
                    .map(|(key, value)| (key, sort_json(value)))
                    .collect(),
            )
        }
        scalar => scalar,
    }
}

#[derive(Debug)]
enum ValueError {
    FloatingPoint,
    Message(String),
}

impl serde::ser::Error for ValueError {
    fn custom<T: fmt::Display>(message: T) -> Self {
        Self::Message(message.to_string())
    }
}

impl fmt::Display for ValueError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::FloatingPoint => formatter.write_str("floating-point value is not canonical"),
            Self::Message(message) => formatter.write_str(message),
        }
    }
}

impl std::error::Error for ValueError {}

impl From<ValueError> for CoreError {
    fn from(error: ValueError) -> Self {
        match error {
            ValueError::FloatingPoint => Self::FloatingPoint,
            ValueError::Message(message) => Self::Serialization(message),
        }
    }
}

struct ValueSerializer;

impl Serializer for ValueSerializer {
    type Ok = Value;
    type Error = ValueError;
    type SerializeSeq = SequenceSerializer;
    type SerializeTuple = SequenceSerializer;
    type SerializeTupleStruct = SequenceSerializer;
    type SerializeTupleVariant = SequenceSerializer;
    type SerializeMap = ObjectSerializer;
    type SerializeStruct = ObjectSerializer;
    type SerializeStructVariant = ObjectSerializer;

    fn serialize_bool(self, value: bool) -> Result<Value, ValueError> {
        Ok(Value::Bool(value))
    }

    fn serialize_i8(self, value: i8) -> Result<Value, ValueError> {
        self.serialize_i64(i64::from(value))
    }

    fn serialize_i16(self, value: i16) -> Result<Value, ValueError> {
        self.serialize_i64(i64::from(value))
    }

    fn serialize_i32(self, value: i32) -> Result<Value, ValueError> {
        self.serialize_i64(i64::from(value))
    }

    fn serialize_i64(self, value: i64) -> Result<Value, ValueError> {
        Ok(Value::Number(Number::from(value)))
    }

    fn serialize_i128(self, value: i128) -> Result<Value, ValueError> {
        i64::try_from(value)
            .map_err(|_| ValueError::custom("i128 is outside the JSON integer range"))
            .and_then(|value| self.serialize_i64(value))
    }

    fn serialize_u8(self, value: u8) -> Result<Value, ValueError> {
        self.serialize_u64(u64::from(value))
    }

    fn serialize_u16(self, value: u16) -> Result<Value, ValueError> {
        self.serialize_u64(u64::from(value))
    }

    fn serialize_u32(self, value: u32) -> Result<Value, ValueError> {
        self.serialize_u64(u64::from(value))
    }

    fn serialize_u64(self, value: u64) -> Result<Value, ValueError> {
        Ok(Value::Number(Number::from(value)))
    }

    fn serialize_u128(self, value: u128) -> Result<Value, ValueError> {
        u64::try_from(value)
            .map_err(|_| ValueError::custom("u128 is outside the JSON integer range"))
            .and_then(|value| self.serialize_u64(value))
    }

    fn serialize_f32(self, value: f32) -> Result<Value, ValueError> {
        self.serialize_f64(f64::from(value))
    }

    fn serialize_f64(self, value: f64) -> Result<Value, ValueError> {
        if !value.is_finite() {
            return Err(ValueError::FloatingPoint);
        }
        Number::from_f64(value)
            .map(Value::Number)
            .ok_or(ValueError::FloatingPoint)
    }

    fn serialize_char(self, value: char) -> Result<Value, ValueError> {
        self.serialize_str(&value.to_string())
    }

    fn serialize_str(self, value: &str) -> Result<Value, ValueError> {
        Ok(Value::String(value.to_owned()))
    }

    fn serialize_bytes(self, value: &[u8]) -> Result<Value, ValueError> {
        Ok(Value::Array(
            value
                .iter()
                .map(|byte| Value::Number(Number::from(*byte)))
                .collect(),
        ))
    }

    fn serialize_none(self) -> Result<Value, ValueError> {
        Ok(Value::Null)
    }

    fn serialize_some<T: ?Sized + Serialize>(self, value: &T) -> Result<Value, ValueError> {
        value.serialize(self)
    }

    fn serialize_unit(self) -> Result<Value, ValueError> {
        Ok(Value::Null)
    }

    fn serialize_unit_struct(self, _name: &'static str) -> Result<Value, ValueError> {
        self.serialize_unit()
    }

    fn serialize_unit_variant(
        self,
        _name: &'static str,
        _variant_index: u32,
        variant: &'static str,
    ) -> Result<Value, ValueError> {
        self.serialize_str(variant)
    }

    fn serialize_newtype_struct<T: ?Sized + Serialize>(
        self,
        _name: &'static str,
        value: &T,
    ) -> Result<Value, ValueError> {
        value.serialize(self)
    }

    fn serialize_newtype_variant<T: ?Sized + Serialize>(
        self,
        _name: &'static str,
        _variant_index: u32,
        variant: &'static str,
        value: &T,
    ) -> Result<Value, ValueError> {
        let mut object = Map::new();
        object.insert(variant.to_owned(), value.serialize(ValueSerializer)?);
        Ok(Value::Object(object))
    }

    fn serialize_seq(self, length: Option<usize>) -> Result<SequenceSerializer, ValueError> {
        Ok(SequenceSerializer::new(length, None))
    }

    fn serialize_tuple(self, length: usize) -> Result<SequenceSerializer, ValueError> {
        self.serialize_seq(Some(length))
    }

    fn serialize_tuple_struct(
        self,
        _name: &'static str,
        length: usize,
    ) -> Result<SequenceSerializer, ValueError> {
        self.serialize_seq(Some(length))
    }

    fn serialize_tuple_variant(
        self,
        _name: &'static str,
        _variant_index: u32,
        variant: &'static str,
        length: usize,
    ) -> Result<SequenceSerializer, ValueError> {
        Ok(SequenceSerializer::new(Some(length), Some(variant)))
    }

    fn serialize_map(self, length: Option<usize>) -> Result<ObjectSerializer, ValueError> {
        Ok(ObjectSerializer::new(length, None))
    }

    fn serialize_struct(
        self,
        _name: &'static str,
        length: usize,
    ) -> Result<ObjectSerializer, ValueError> {
        self.serialize_map(Some(length))
    }

    fn serialize_struct_variant(
        self,
        _name: &'static str,
        _variant_index: u32,
        variant: &'static str,
        length: usize,
    ) -> Result<ObjectSerializer, ValueError> {
        Ok(ObjectSerializer::new(Some(length), Some(variant)))
    }
}

struct SequenceSerializer {
    values: Vec<Value>,
    variant: Option<&'static str>,
}

impl SequenceSerializer {
    fn new(length: Option<usize>, variant: Option<&'static str>) -> Self {
        Self {
            values: Vec::with_capacity(length.unwrap_or(0)),
            variant,
        }
    }

    fn push<T: ?Sized + Serialize>(&mut self, value: &T) -> Result<(), ValueError> {
        self.values.push(value.serialize(ValueSerializer)?);
        Ok(())
    }

    fn finish(self) -> Value {
        let array = Value::Array(self.values);
        match self.variant {
            Some(variant) => {
                let mut object = Map::new();
                object.insert(variant.to_owned(), array);
                Value::Object(object)
            }
            None => array,
        }
    }
}

impl SerializeSeq for SequenceSerializer {
    type Ok = Value;
    type Error = ValueError;

    fn serialize_element<T: ?Sized + Serialize>(&mut self, value: &T) -> Result<(), ValueError> {
        self.push(value)
    }

    fn end(self) -> Result<Value, ValueError> {
        Ok(self.finish())
    }
}

macro_rules! sequence_serializer {
    ($trait_name:ident, $method:ident) => {
        impl $trait_name for SequenceSerializer {
            type Ok = Value;
            type Error = ValueError;

            fn $method<T: ?Sized + Serialize>(&mut self, value: &T) -> Result<(), ValueError> {
                self.push(value)
            }

            fn end(self) -> Result<Value, ValueError> {
                Ok(self.finish())
            }
        }
    };
}

sequence_serializer!(SerializeTuple, serialize_element);
sequence_serializer!(SerializeTupleStruct, serialize_field);
sequence_serializer!(SerializeTupleVariant, serialize_field);

struct ObjectSerializer {
    entries: Map<String, Value>,
    next_key: Option<String>,
    variant: Option<&'static str>,
}

impl ObjectSerializer {
    fn new(length: Option<usize>, variant: Option<&'static str>) -> Self {
        Self {
            entries: Map::with_capacity(length.unwrap_or(0)),
            next_key: None,
            variant,
        }
    }

    fn insert<T: ?Sized + Serialize>(&mut self, key: &str, value: &T) -> Result<(), ValueError> {
        self.entries
            .insert(key.to_owned(), value.serialize(ValueSerializer)?);
        Ok(())
    }

    fn finish(self) -> Value {
        let object = Value::Object(self.entries);
        match self.variant {
            Some(variant) => {
                let mut outer = Map::new();
                outer.insert(variant.to_owned(), object);
                Value::Object(outer)
            }
            None => object,
        }
    }
}

impl SerializeMap for ObjectSerializer {
    type Ok = Value;
    type Error = ValueError;

    fn serialize_key<T: ?Sized + Serialize>(&mut self, key: &T) -> Result<(), ValueError> {
        let key = key.serialize(ValueSerializer)?;
        self.next_key = Some(value_to_key(key)?);
        Ok(())
    }

    fn serialize_value<T: ?Sized + Serialize>(&mut self, value: &T) -> Result<(), ValueError> {
        let key = self
            .next_key
            .take()
            .ok_or_else(|| ValueError::custom("map value serialized before key"))?;
        self.insert(&key, value)
    }

    fn end(self) -> Result<Value, ValueError> {
        if self.next_key.is_some() {
            return Err(ValueError::custom("map key serialized without value"));
        }
        Ok(self.finish())
    }
}

impl SerializeStruct for ObjectSerializer {
    type Ok = Value;
    type Error = ValueError;

    fn serialize_field<T: ?Sized + Serialize>(
        &mut self,
        key: &'static str,
        value: &T,
    ) -> Result<(), ValueError> {
        self.insert(key, value)
    }

    fn end(self) -> Result<Value, ValueError> {
        Ok(self.finish())
    }
}

impl SerializeStructVariant for ObjectSerializer {
    type Ok = Value;
    type Error = ValueError;

    fn serialize_field<T: ?Sized + Serialize>(
        &mut self,
        key: &'static str,
        value: &T,
    ) -> Result<(), ValueError> {
        self.insert(key, value)
    }

    fn end(self) -> Result<Value, ValueError> {
        Ok(self.finish())
    }
}

fn value_to_key(value: Value) -> Result<String, ValueError> {
    match value {
        Value::String(value) => Ok(value),
        Value::Bool(value) => Ok(value.to_string()),
        Value::Number(value) if value.is_f64() => Err(ValueError::FloatingPoint),
        Value::Number(value) => Ok(value.to_string()),
        _ => Err(ValueError::custom(
            "JSON object key must be a string, boolean, or integer",
        )),
    }
}
