use core::mosaic_face::mosaic_face;
use image::{io::Reader as ImageReader, RgbaImage};
use std::path::Path;

fn main() {
    let path = Path::new("./packages/test-cli/src/test.png");
    let img = ImageReader::open(path)
        .unwrap()
        .decode()
        .unwrap();
        // .to_rgba8(); // RGB8 を RGBA8 に変換

    println!("Image color type: {:?}", img.color());

    let width = img.width();
    let height = img.height();

    // RGBAフォーマットの画像データを取得
    let vec = img.as_raw().to_vec();

    // デバッグ: バッファ長さと期待値を確認
    let expected_length = (width * height * 4) as usize; // RGBAなので4チャンネル
    if vec.len() != expected_length {
        panic!(
            "Buffer length mismatch! Expected {}, but got {}",
            expected_length,
            vec.len()
        );
    }

    // モザイク処理
    let mosaic_vec = mosaic_face(vec, width, height, 50);
    let mosaic_image = RgbaImage::from_vec(width, height, mosaic_vec).unwrap();
    let _ = mosaic_image.save("./packages/test-cli/src/result.png");
}
