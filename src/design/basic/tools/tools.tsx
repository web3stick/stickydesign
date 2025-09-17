// STICKY_design_tools
import "./tools.css";

interface Tool {
  name: string;
  description: string;
  link: string;
}

const STICKY_design_tools = () => {
  const tools: Tool[] = [
    {
      name: "Preact",
      description: "Fast 3kB alternative to React with the same modern API.",
      link: "https://preactjs.com/"
    },
    {
      name: "Rsbuild",
      description: "A fast Rspack-based build tool designed for web development.",
      link: "https://rsbuild.dev/"
    },
    {
      name: "Lucide Icons",
      description: "Beautiful & consistent icon toolkit made by the community.",
      link: "https://lucide.dev/"
    },
    {
      name: "FASTINTEAR",
      description: "Simple, intuitive JavaScript library for interacting with the NEAR Protocol blockchain.",
      link: "github.com/elliotBraem/fastintear"
    }
  ];

  return (
    <section className="tools-section">
      <h1>TOOLS</h1>
      <p>tools i use to make great design</p>
      <div className="tools-grid">
        {tools.map((tool, index) => (
          <a 
            key={index} 
            href={tool.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="tool-card"
          >
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
};

export default STICKY_design_tools;