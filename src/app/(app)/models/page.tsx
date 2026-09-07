import { Metadata } from "next"
import { ModelLab } from "@/components/ModelLab"

export const metadata: Metadata = {
  title: "Browser AI Models Lab",
  description: "Test and compare client-side AI models running directly in your browser using WebAssembly.",
}

export default function ModelsPage() {
  return <ModelLab />
}

