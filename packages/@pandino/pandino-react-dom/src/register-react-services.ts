import { BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import { Component, useContext, useEffect, useState } from 'react';
import jsxRuntime from 'react/jsx-runtime';
import { ReactBundleContext } from './react-bundle-context';

const jxsr = jsxRuntime as any;

export function registerReactServices(context: BundleContext): ServiceRegistration<any>[] {
  const registrations: Map<string, any> = new Map<string, any>([
    ['@pandino/pandino-react-dom/react/useEffect', useEffect],
    ['@pandino/pandino-react-dom/react/useState', useState],
    ['@pandino/pandino-react-dom/react/Component', Component],
    ['@pandino/pandino-react-dom/react/jsx-runtime/jsxs', jxsr.jsxs],
    ['@pandino/pandino-react-dom/react/jsx-runtime/jsx', jxsr.jsx],
    ['@pandino/pandino-react-dom/react/jsx-runtime/Fragment', jxsr.Fragment],
    ['@pandino/pandino-react-dom/useReactBundleContext', () => useContext(ReactBundleContext)],
    ['@pandino/pandino-react-dom/ReactBundleContext', ReactBundleContext],
  ]);

  return Array.from(registrations.entries()).map(([objectClass, value]) => context.registerService(objectClass, value));
}
