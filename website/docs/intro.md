---
sidebar_position: 1
---

# Introduction to Pandino

[![npm version](https://badge.fury.io/js/@pandino%2Fpandino.svg)](https://badge.fury.io/js/@pandino%2Fpandino)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

Pandino is a lightweight TypeScript framework that brings **modular architecture** to your applications. Build loosely-coupled, maintainable applications where different parts can communicate without knowing about each other directly.

## Why Pandino?

**Traditional DI vs Pandino Service Registry:**

| Traditional DI | Pandino Service Registry |
|----------------|-------------------------|
| Static dependency injection | Dynamic service discovery |
| Compile-time wiring | Runtime service resolution |
| Hard-coded dependencies | LDAP-filtered service selection |
| Single service per interface | Multiple ranked services |
| Manual lifecycle management | Automatic service lifecycle |

## Key Features

| Feature | What it Solves | Benefit |
|---------|----------------|---------|
| 🔌 **Service Registry** | Hard-coded dependencies between modules | Services discover each other dynamically |
| 📦 **Bundle System** | Monolithic application architecture | Modular containers with independent lifecycles |
| 🔄 **Dynamic Dependencies** | Startup order dependencies | Bundles start in any order, dependencies resolve automatically |
| 📡 **Event System** | Tight coupling between modules | Publish-subscribe messaging with topic-based routing |
| ⚙️ **Configuration Management** | Static application configuration | Runtime configuration updates without restarts |
| 🏗️ **Declarative Services** | Complex service wiring boilerplate | Decorator-based dependency injection |
| ⚛️ **React Integration** | Framework complexity in React apps | Hook-based service discovery in components |

## Packages

| Package | Purpose |
|---------|---------|
| [`@pandino/pandino`](/docs/packages/pandino) | Core framework with service registry, bundles, and built-in services |
| [`@pandino/react-hooks`](/docs/packages/react-hooks) | React integration with hooks and components |
| [`@pandino/decorators`](/docs/packages/decorators) | TypeScript decorators for declarative services |

## Use Cases

| Scenario | Traditional Approach | Pandino Approach |
|----------|---------------------|------------------|
| **Microservices Architecture** | Hard-coded service URLs | Dynamic service discovery |
| **Plugin Systems** | Manual plugin loading | Bundle-based plugins with auto-discovery |
| **Feature Flags** | Code-level toggles | Service-level feature activation |
| **Multi-tenant Apps** | Complex configuration management | Service filtering by tenant properties |
| **A/B Testing** | Conditional code blocks | Multiple service implementations with ranking |
