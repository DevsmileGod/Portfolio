export interface Experience {
  company: string;
  role: string;
  period: string;
  /** A line under the role, in the accent colour */
  platform?: string;
  achievements: string[];
  technologies: string[];
}

export const experiences: Experience[] = [
  {
    company: "Independent",
    role: "Software Engineer · AI Engineer",
    period: "Feb 2026 – Present",
    platform: "Self-employed · Wuhan, Hubei, China",
    achievements: [
      "Design and develop software solutions based on project requirements, focusing on maintainable code, practical functionality, and reliable performance.",
      "Build backend services and REST APIs using Python and related technologies, supporting application integration and data processing.",
      "Explore and develop AI-powered applications using large language models (LLMs), retrieval-augmented generation (RAG), and AI agent workflows.",
      "Work with machine learning models and AI frameworks to support model integration, inference, testing, and deployment.",
      "Develop data processing workflows and integrate databases, APIs, and external services to support end-to-end application functionality.",
      "Use Git, Docker, and modern development tools to organize code, manage changes, and improve development and deployment workflows.",
    ],
    technologies: ["Python", "FastAPI", "REST APIs", "LLMs", "RAG", "AI agents", "Docker", "Git"],
  },
  {
    company: "Black Sesame Technologies",
    role: "Senior AI Software Engineer",
    period: "Jul 2022 – Jan 2026",
    platform: "Autonomous-driving AI · automotive AI chips",
    achievements: [
      "Developed and deployed 30+ PyTorch perception models for in-vehicle AI chips across five automotive customer programs.",
      "Optimized deep learning models through INT8 quantization, achieving up to 3.2× lower inference latency and 60% lower memory usage with less than 1% mAP loss.",
      "Developed and optimized C++ and CUDA kernels, improving inference throughput by 45%.",
      "Built a retrieval-augmented generation (RAG) assistant over 200,000+ pages of technical documentation, adopted by 600+ engineers and improving ticket resolution by 35%.",
      "Developed LLM-based tools for compiler-log analysis and troubleshooting, helping resolve approximately 40% of common model-conversion errors.",
      "Optimized LLM inference services using vLLM, Kubernetes, dynamic batching, and autoscaling, reducing GPU cost per query by 50%.",
      "Led a team of seven engineers and collaborated with automotive customers and Tier-1 suppliers on AI deployment and integration.",
    ],
    technologies: ["PyTorch", "INT8 quantization", "C++", "CUDA", "RAG", "LLMs", "vLLM", "Kubernetes"],
  },
  {
    company: "FiberHome Technologies",
    role: "Software Engineer, AI Platform",
    period: "Jul 2020 – Jun 2022",
    platform: "AI operations for telecommunications infrastructure",
    achievements: [
      "Built anomaly detection systems using LSTM and Isolation Forest to analyze more than two billion telemetry records per day.",
      "Developed predictive monitoring capabilities that identified potential link degradation approximately 30 minutes earlier and helped reduce outages by 25%.",
      "Implemented root-cause analysis workflows that reduced alarm noise by 70% and mean time to repair (MTTR) by 40%.",
      "Developed a BERT-based ticket classification and routing system that achieved 91% accuracy and saved an estimated 3,000 engineering hours annually.",
      "Built real-time data pipelines using Kafka and Flink, supporting prediction workflows with sub-second processing latency.",
      "Developed Go and Java microservices capable of handling more than 10,000 requests per second in Kubernetes environments.",
      "Implemented MLflow-based model lifecycle workflows, reducing the model release cycle from four weeks to one week.",
    ],
    technologies: ["LSTM", "Isolation Forest", "BERT", "Kafka", "Flink", "Go", "Java", "Kubernetes", "MLflow"],
  },
  {
    company: "Yangtze Memory Technologies",
    role: "Software Engineer",
    period: "Jul 2018 – Jun 2020",
    platform: "Semiconductor manufacturing",
    achievements: [
      "Developed a ResNet-based wafer defect classification system that achieved 95% accuracy and automated approximately 60% of manual defect review.",
      "Implemented anomaly detection solutions to identify manufacturing irregularities and support process optimization, contributing to a 2% yield improvement.",
      "Developed Python and Java services for manufacturing execution system (MES) data processing, handling millions of records per day.",
      "Built data processing pipelines using Apache Spark and Hive to support manufacturing analytics and reporting.",
      "Developed React-based engineering dashboards used by more than 100 engineers to monitor manufacturing data and defect analysis results.",
    ],
    technologies: ["ResNet", "Python", "Java", "Apache Spark", "Hive", "SQL", "React"],
  },
];

/**
 * The employers in time order, for the Experience zoom: each fades in at `from` and out at the
 * next one's, as the year rolls from the first to today.
 */
export const ERAS = [
  { from: 2018, company: "Yangtze Memory Technologies", line: "Semiconductor manufacturing" },
  { from: 2020, company: "FiberHome Technologies", line: "Telecommunications AI platform" },
  { from: 2022, company: "Black Sesame Technologies", line: "Autonomous-driving AI, senior engineer" },
  { from: 2026, company: "Independent", line: "Backend, LLM, and AI-agent work" },
] as const;
