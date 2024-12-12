use crate::center_face::CenterFace;
use image::{imageops, EncodableLayout, ImageBuffer, Rgb, Rgba};

fn rgba8_to_rgb8(
    input: image::ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> image::ImageBuffer<Rgb<u8>, Vec<u8>> {
    let width = input.width() as usize;
    let height = input.height() as usize;

    let input: &Vec<u8> = input.as_raw();
    let mut output_data = vec![0u8; width * height * 3];
    let mut i = 0;
    for chunk in input.chunks(4) {
        output_data[i..i + 3].copy_from_slice(&chunk[0..3]);
        i += 3;
    }
    image::ImageBuffer::from_raw(width as u32, height as u32, output_data).unwrap()
}

// mosaic_coarseness : モザイクの粗さ（細 1〜100 粗）
pub fn mosaic_face(buf: Vec<u8>, width: u32, height: u32, mosaic_coarseness: u32) -> Vec<u8> {
    let mut image: ImageBuffer<Rgba<u8>, Vec<_>> =
        ImageBuffer::from_raw(width, height, buf).unwrap();
    let image_rgb = rgba8_to_rgb8(image.clone());
    let scale = 2;

    let wf = image_rgb.width() / 32 / scale;
    let hf = image_rgb.height() / 32 / scale;
    let cf = CenterFace::new(32 * wf, 32 * hf).unwrap();
    println!("model initialized");
    let faces = cf.detect_with_resize(&image_rgb).unwrap();
    println!("{} faces are detected", faces.len());

    let img_width = image.width();
    let img_height = image.height();
    let rect_buffer = 32;

    for f in faces {
        let fx = std::cmp::max(f.x1 - rect_buffer, 0);
        let fy = std::cmp::max(f.y1 - rect_buffer, 0);
        let fw = std::cmp::min(f.x2 + rect_buffer, img_width) - fx;
        let fh = std::cmp::min(f.y2 + rect_buffer, img_height) - fy;

        let cropped = imageops::crop(&mut image, fx, fy, fw, fh).to_image();

        let ratio = 1.0 as f32 / mosaic_coarseness as f32;
        let resized = imageops::resize(
            &cropped,
            (fw as f32 * ratio) as u32,
            (fh as f32 * ratio) as u32,
            imageops::FilterType::Nearest,
        );
        let mosaic = imageops::resize(&resized, fw, fh, imageops::FilterType::Nearest);
        image::imageops::overlay(&mut image, &mosaic, fx.into(), fy.into());
    }
    return image.as_bytes().to_vec();
}
