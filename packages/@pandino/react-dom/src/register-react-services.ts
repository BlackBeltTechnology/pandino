import { BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import {
  COMPONENT_PROXY_INTERFACE_KEY,
  REACT_CHILDREN_INTERFACE_KEY,
  REACT_COMPONENT_INTERFACE_KEY,
  REACT_CREATE_CONTEXT_INTERFACE_KEY,
  REACT_CREATE_ELEMENT_INTERFACE_KEY,
  REACT_DOM_FLUSH_SYNC_INTERFACE_KEY,
  REACT_FORWARD_REF_INTERFACE_KEY,
  REACT_FRAGMENT_INTERFACE_KEY,
  REACT_IS_VALID_ELEMENT_INTERFACE_KEY,
  REACT_JSX_INTERFACE_KEY,
  REACT_JSXS_INTERFACE_KEY,
  REACT_REACT_INTERFACE_KEY,
  REACT_USE_CALLBACK_INTERFACE_KEY,
  REACT_USE_CONTEXT_INTERFACE_KEY,
  REACT_USE_EFFECT_INTERFACE_KEY,
  REACT_USE_LAYOUT_EFFECT_INTERFACE_KEY,
  REACT_USE_MEMO_INTERFACE_KEY,
  REACT_USE_REF_INTERFACE_KEY,
  REACT_USE_STATE_INTERFACE_KEY,
  USE_REACT_BUNDLE_CONTEXT_INTERFACE_KEY,
} from '@pandino/react-dom-api';
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
import { ComponentProxy } from './component-proxy';

const jxsr = jsxRuntime as any;

export function registerReactServices(context: BundleContext): ServiceRegistration<any>[] {
  const registrations: Map<string, any> = new Map<string, any>([
    [REACT_DOM_FLUSH_SYNC_INTERFACE_KEY, flushSync],

    [REACT_JSXS_INTERFACE_KEY, jxsr.jsxs],
    [REACT_JSX_INTERFACE_KEY, jxsr.jsx],
    [REACT_FRAGMENT_INTERFACE_KEY, jxsr.Fragment],

    [REACT_REACT_INTERFACE_KEY, React],
    [REACT_COMPONENT_INTERFACE_KEY, Component],
    [REACT_CHILDREN_INTERFACE_KEY, Children],

    [REACT_USE_LAYOUT_EFFECT_INTERFACE_KEY, useLayoutEffect],
    [REACT_USE_REF_INTERFACE_KEY, useRef],
    [REACT_USE_MEMO_INTERFACE_KEY, useMemo],
    [REACT_USE_CONTEXT_INTERFACE_KEY, useContext],
    [REACT_USE_EFFECT_INTERFACE_KEY, useEffect],
    [REACT_USE_CALLBACK_INTERFACE_KEY, useCallback],
    [REACT_USE_STATE_INTERFACE_KEY, useState],

    [REACT_CREATE_CONTEXT_INTERFACE_KEY, createContext],
    [REACT_CREATE_ELEMENT_INTERFACE_KEY, createElement],
    [REACT_IS_VALID_ELEMENT_INTERFACE_KEY, isValidElement],
    [REACT_FORWARD_REF_INTERFACE_KEY, forwardRef],

    [USE_REACT_BUNDLE_CONTEXT_INTERFACE_KEY, () => context],
    [COMPONENT_PROXY_INTERFACE_KEY, ComponentProxy],
  ]);

  return Array.from(registrations.entries()).map(([objectClass, value]) => context.registerService(objectClass, value));
}
