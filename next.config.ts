import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone', 

  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node'],
};

export default nextConfig;
