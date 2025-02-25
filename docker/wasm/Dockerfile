# Rust build stage
FROM debian:stable-slim AS rust_builder

RUN apt update && apt install -y curl libssl-dev build-essential pkg-config

ENV RUST_HOME /usr/local/lib/rust
ENV RUSTUP_HOME ${RUST_HOME}/rustup
ENV CARGO_HOME ${RUST_HOME}/cargo
RUN mkdir /usr/local/lib/rust && \
    chmod 0755 $RUST_HOME

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > ${RUST_HOME}/rustup.sh \
    && chmod +x ${RUST_HOME}/rustup.sh \
    && ${RUST_HOME}/rustup.sh -y --default-toolchain stable
ENV PATH $PATH:$CARGO_HOME/bin

RUN rustup update
RUN rustup target add wasm32-unknown-unknown

RUN cargo install wasm-pack
RUN cargo install --force cargo-make

WORKDIR /src
COPY ./src/face_blur_wasm ./face_blur_wasm

WORKDIR /src/face_blur_wasm/packages/wasm
RUN wasm-pack build --target web

# Node.js build stage
FROM node:18-slim AS node_builder

WORKDIR /app
COPY ./src/react ./react
COPY --from=rust_builder /src/face_blur_wasm/packages/wasm/pkg ./react/src/pkg

WORKDIR /app/react
RUN npm install
RUN npm run build

# Final stage
FROM nginx:alpine AS final_stage

COPY --from=node_builder /app/react/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
