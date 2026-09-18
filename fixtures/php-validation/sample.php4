<?php
// UTF-8: Привет
use Vendor\Payload as Item;
function Helper(Item $value): Item { return $value; }
function caller(Item $value): Item { return HELPER($value); }
function dynamic($receiver, $name, $value) { return $receiver->$name($value); }
class Decoy { public function Helper() {} }
