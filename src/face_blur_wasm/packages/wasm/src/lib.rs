use core::mosaic_face::mosaic_face;

use wasm_bindgen::{prelude::wasm_bindgen, Clamped};

#[wasm_bindgen]
pub fn exec_mosaic_face(
    buf: Clamped<Vec<u8>>,
    width: u32,
    height: u32,
    mosaic_coarseness: u32,
) -> Vec<u8> {
    mosaic_face(buf.0, width, height, mosaic_coarseness)
}
