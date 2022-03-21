import {Component, FC} from "react";

export interface ComponentProvider {
  getIdentifier(): string;
  getComponent(): FC<any> | typeof Component;
  getFilter(): string | undefined;
}
