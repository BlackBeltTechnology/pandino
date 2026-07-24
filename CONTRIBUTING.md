# 🤝 Contributing to Pandino

We welcome contributions! Here's how to get started quickly.

## 🚀 Quick Setup

```bash
# Clone and setup
git clone https://github.com/BlackBeltTechnology/pandino.git
cd pandino
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 📋 Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following our [coding standards](#-coding-standards)
4. **Test** your changes: `pnpm test`
5. **Commit** with conventional commits: `feat: add amazing feature`
6. **Push** and create a **Pull Request**

## 🎯 What We Accept

| Type                 | Examples                                             |
| -------------------- | ---------------------------------------------------- |
| 🐛 **Bug fixes**     | Fix service registration race conditions             |
| ✨ **Features**      | New built-in services, bundle lifecycle improvements |
| 📚 **Documentation** | README improvements, code examples                   |
| 🔧 **Tooling**       | Build improvements, test utilities                   |
| ⚡ **Performance**   | Bundle startup optimizations                         |

## 📝 Coding Standards

- **Tests required** - New features need unit tests
- **Conventional commits** - Use `feat:`, `fix:`, `docs:`, etc.
- **Code linter** - We use OXC (runs automatically)
- **Code formatting** - We use oxfmt (runs automatically)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Test specific package
pnpm --filter @pandino/pandino test
```

## 📦 Project Structure

```
packages/
├── pandino/              # Core framework
├── decorators/           # SCR decorators (@Component, @Service, ...)
├── react-hooks/          # React integration
├── rollup-bundle-plugin/ # Build-time bundle packaging
└── example/              # Demo application (private)
```

## 🐛 Bug Reports

Include:

- **Environment** - Node.js version, OS, package versions
- **Steps to reproduce** - Minimal code example
- **Expected vs actual behavior**
- **Error messages** - Full stack traces

## 💬 Questions?

- 📋 **Issues** - For bugs and feature requests
- 📧 **Email** - For security issues: [norbert.herczeg@blackbelt.hu](mailto:norbert.herczeg@blackbelt.hu)

## 📄 License

By contributing, you agree your contributions will be licensed under the [Eclipse Public License - v 2.0](LICENSE).

---

**Thanks for making Pandino better! 🎉**
