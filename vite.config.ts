import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages project site: https://westkitty.github.io/Weaselworks/
const pagesBase = process.env.WW_PAGES_BASE ?? '/'

export default defineConfig({
  plugins: [react()],
  base: pagesBase,
})
