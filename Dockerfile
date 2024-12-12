FROM debian:stable-slim

RUN apt update && apt install -y curl tree npm libssl-dev build-essential pkg-config

# Rustをサイレントインストール（cargo、rustc、rustupコマンドなどがインストールされる）
ENV RUST_HOME /usr/local/lib/rust
ENV RUSTUP_HOME ${RUST_HOME}/rustup
ENV CARGO_HOME ${RUST_HOME}/cargo
RUN mkdir /usr/local/lib/rust && \
    chmod 0755 $RUST_HOME
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > ${RUST_HOME}/rustup.sh \
    && chmod +x ${RUST_HOME}/rustup.sh \
    && ${RUST_HOME}/rustup.sh -y --default-toolchain stable
ENV PATH $PATH:$CARGO_HOME/bin

## toolchainを更新
RUN rustup update

## WebAssemblyへのコンパイル機能を有効化
RUN rustup target add wasm32-unknown-unknown

# wasm-pack（RustのコードをWebAssemblyに変換しnpmパッケージを構築するツール）をインストール
RUN cargo install wasm-pack

# cargo-make（タスクランナー）をインストール
RUN cargo install --force cargo-make
