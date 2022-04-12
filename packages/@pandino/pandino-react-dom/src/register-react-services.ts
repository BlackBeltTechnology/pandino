import { BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import {
  default as React,
  Component,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  createElement,
  useLayoutEffect,
  createContext,
  isValidElement,
  Children,
  forwardRef,
} from 'react';
import { flushSync } from 'react-dom';
import jsxRuntime from 'react/jsx-runtime';
import { ReactBundleContext } from './react-bundle-context';
import { ComponentProxy } from "./component-proxy";

const jxsr = jsxRuntime as any;

export function registerReactServices(context: BundleContext): ServiceRegistration<any>[] {
  const registrations: Map<string, any> = new Map<string, any>([
    ['@pandino/pandino-react-dom/react-dom/flushSync', flushSync],

    ['@pandino/pandino-react-dom/react/isValidElement', isValidElement],
    ['@pandino/pandino-react-dom/react/createContext', createContext],
    ['@pandino/pandino-react-dom/react/useLayoutEffect', useLayoutEffect],
    ['@pandino/pandino-react-dom/react/useRef', useRef],
    ['@pandino/pandino-react-dom/react/createElement', createElement],
    ['@pandino/pandino-react-dom/react/forwardRef', forwardRef],
    ['@pandino/pandino-react-dom/react/useMemo', useMemo],
    ['@pandino/pandino-react-dom/react/useContext', useContext],
    ['@pandino/pandino-react-dom/react/useEffect', useEffect],
    ['@pandino/pandino-react-dom/react/useCallback', useCallback],
    ['@pandino/pandino-react-dom/react/useState', useState],
    ['@pandino/pandino-react-dom/react/React', React],
    ['@pandino/pandino-react-dom/react/Component', Component],
    ['@pandino/pandino-react-dom/react/Children', Children],
    ['@pandino/pandino-react-dom/react/jsx-runtime/jsxs', jxsr.jsxs],
    ['@pandino/pandino-react-dom/react/jsx-runtime/jsx', jxsr.jsx],
    ['@pandino/pandino-react-dom/react/jsx-runtime/Fragment', jxsr.Fragment],
    ['@pandino/pandino-react-dom/useReactBundleContext', () => useContext(ReactBundleContext)],
    ['@pandino/pandino-react-dom/ReactBundleContext', ReactBundleContext],
    ['@pandino/pandino-react-dom/ComponentProxy', ComponentProxy],
  ]);

  return Array.from(registrations.entries()).map(([objectClass, value]) => context.registerService(objectClass, value));
}
