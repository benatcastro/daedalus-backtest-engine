# fin-data-manager

A Rust service (using [actix-web](https://actix.rs/)) intended to manage
financial datasets for the Daedalus platform. It is currently an early scaffold.

- **Language/stack:** Rust (edition 2024), actix-web
- **Build system:** Cargo workspace (rooted at the repo's `Cargo.toml`), wired
  into Nx via [`@monodon/rust`](https://github.com/Cammisuli/monodon)

## Prerequisites

- [Rust](https://rustup.rs/) toolchain with `cargo` ≥ 1.94 (edition 2024)

## Build & run

From the **monorepo root**:

```bash
npx nx build fin-data-manager     # cargo build -p fin-data-manager
npx nx run fin-data-manager       # cargo run -p fin-data-manager
npx nx check fin-data-manager     # cargo check (fast type-check)
npx nx test fin-data-manager      # cargo test
npx nx lint fin-data-manager      # cargo clippy
```

Build artifacts are written to `dist/target/` (configured in the workspace
`.cargo/config.toml`), not the crate-local `target/`.

You can also use Cargo directly:

```bash
cargo run -p fin-data-manager
```

## Nx targets

| Target | Cargo command | Purpose |
|--------|---------------|---------|
| `build` | `cargo build -p fin-data-manager` | Compile (debug; `--configuration production` for release) |
| `run` | `cargo run -p fin-data-manager` | Run the binary |
| `check` | `cargo check -p fin-data-manager` | Fast type-check |
| `test` | `cargo test -p fin-data-manager` | Run tests |
| `lint` | `cargo clippy -p fin-data-manager` | Lint |

## Environment & API keys

None required yet. As the service grows, document any data-source credentials
here and add a local `.env`/config as needed.
