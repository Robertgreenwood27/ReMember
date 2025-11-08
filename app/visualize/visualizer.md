🧠 Dream Visualization System Overview

This folder (/app/visualize/) implements an interactive 3D neural visualization of dream data stored in Supabase.

🧩 Core Concept

Each dream entry is represented as a neuron node (NeuronNode), and each symbol word (noun extracted from dreams) is represented as a symbol node (SymbolNeuron).
Lines, particles, and shader effects visualize their relationships and energy flow.

The visualization is fully responsive, using mobile and desktop UIs with different info panels.

🗂️ Folder Structure
Path	Description
page.tsx	Entry point rendering the scene with Three.js, camera controls, UI panels, bloom/aberration effects, and data loading from Supabase.
components/NeuralGraph.tsx	Main graph orchestrator: runs force simulation, manages activation waves, and renders all nodes, connections, and particles.
components/NeuronNode.tsx	Renders each dream as a glowing, pulsing neuron sphere using custom shaders and emotional color mapping from tags.
components/SymbolNeuron.tsx	Renders each symbol (noun) as a golden node; clicking opens /write?symbol={word}.
components/NeuralConnections.tsx	Connects dreams and symbols with glowing, animated tubular lines (PulsingLine) and tag-based connections (TagLabel).
components/EnergyParticles.tsx	Animates small glowing points traveling between connected nodes to simulate electrical activity.
components/DesktopInfoPanel.tsx	Dream detail overlay for desktop — shows text, date, tags, and related symbols.
components/MobileDreamSheet.tsx	Mobile version of the info panel, sliding up from the bottom.
hooks/useForceSimulation.tsx	Handles 3D node positioning using a custom lightweight physics simulation (repulsion + attraction).
hooks/useIsMobile.tsx	Detects mobile viewports to adjust physics and UI.
shaders/neuronShader.ts	GLSL shaders for the neuron glow, pulse, iridescence, and holographic effects.
types.ts	Shared TypeScript interfaces for entries, nodes, and connections.
🧠 Data Schema

Dream entries and nodes are stored in Supabase (see schema.sql):

entries: individual dreams with symbol, text, nouns[], and tags[].

nodes: unique symbol words linked to entries.

⚙️ Dependencies

From package.json:

3D Rendering: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing

State/Data: react, @supabase/supabase-js

UI: lucide-react, tailwindcss

Text/NLP: compromise, stopword

🪄 Summary Behavior

page.tsx loads dream data → passes to NeuralGraph.

useForceSimulation positions entries and symbols organically.

NeuralGraph triggers waves, highlighting, and energy pulses on hover or click.

NeuralConnections draws curved glowing tubes between nodes.

EnergyParticles animates electrical pulses along those connections.

NeuronNode / SymbolNeuron render custom shader-based neurons.

DesktopInfoPanel / MobileDreamSheet display entry content and metadata.

🔮 Quick Recap

“The visualize folder renders a 3D neural map of my dreams using React Three Fiber. Dreams are blue neurons, symbols are gold nodes, emotional tags connect them with pink energy lines, and animated particles simulate pulses of thought.”