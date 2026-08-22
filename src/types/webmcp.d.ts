import "react";

declare module "react" {
  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
  }

  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    toolparamdescription?: string;
  }
}

export interface WebMcpToolInputSchema {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface WebMcpToolDefinition {
  name: string;
  description: string;
  inputSchema?: WebMcpToolInputSchema;
  execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

export interface WebMcpModelContext {
  registerTool: (tool: WebMcpToolDefinition) => void;
  getTools?: () => Promise<WebMcpToolDefinition[]>;
  executeTool?: (name: string, input: string) => Promise<unknown>;
}

declare global {
  interface Document {
    modelContext?: WebMcpModelContext;
  }
}

export {};
