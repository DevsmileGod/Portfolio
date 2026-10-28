import {
  Activity,
  BellOff,
  Bot,
  Cpu,
  Database,
  FileSearch,
  GitBranch,
  Microscope,
  Server,
  Split,
  TrendingUp,
  Workflow,
  Zap,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export type ProjectCategory = "AI" | "ML" | "Backend" | "Data" | "MLOps" | "Full-stack";

export interface Project {
  slug: string; // URL friendly identifier
  title: string;
  cardTitle?: string; // The shorter title the Work card shows; falls back to title
  description: string;
  category?: ProjectCategory;
  /** Problem, approach and outcome: left out where there is nothing specific and true to say */
  problem?: string;
  solution?: string;
  outcome?: string;
  tags: string[];
  featured?: boolean;
  icon: LucideIcon;
  /** Own-time, open-source work: its repository */
  repo?: string;
  /** A line under the headline, such as the employer */
  origin?: string;
}

// Professional case studies from the résumé. Every figure is the résumé's own; employer specifics stay general.
export const projects: Project[] = [
  // Black Sesame Technologies: autonomous-driving AI and automotive AI chips
  {
    slug: "int8-perception-models",
    title: "INT8 Perception Models for In-Vehicle AI Chips",
    cardTitle: "INT8 Perception Models",
    description:
      "30+ PyTorch perception models deployed onto in-vehicle AI chips across five automotive customer programs, quantized to INT8.",
    category: "AI",
    problem:
      "Autonomous-driving perception models had to run on in-vehicle AI chips, inside tight latency and memory budgets",
    solution: "Quantized the models to INT8 and deployed them to the automotive AI chip platform",
    outcome: "Up to 3.2× lower inference latency and 60% lower memory usage, with less than 1% mAP loss",
    tags: ["PyTorch", "INT8 quantization", "Perception", "Model deployment"],
    icon: Cpu,
    featured: true,
    origin: "Black Sesame Technologies",
  },
  {
    slug: "cuda-kernels",
    title: "C++ and CUDA Kernel Optimization",
    cardTitle: "CUDA Kernels",
    description: "C++ and CUDA kernels developed and optimized for model inference.",
    category: "AI",
    solution: "Developed and optimized C++ and CUDA kernels on the inference path",
    outcome: "Inference throughput up 45%",
    tags: ["C++", "CUDA", "Inference optimization"],
    icon: Zap,
    featured: true,
    origin: "Black Sesame Technologies",
  },
  {
    slug: "rag-documentation-assistant",
    title: "A RAG Assistant over 200,000+ Pages of Documentation",
    cardTitle: "RAG Documentation Assistant",
    description:
      "A retrieval-augmented generation assistant over 200,000+ pages of technical documentation, adopted by 600+ engineers.",
    category: "AI",
    problem: "The answers engineers needed sat somewhere in 200,000+ pages of technical documentation",
    solution: "Built a RAG assistant that retrieves the relevant documentation and answers from it",
    outcome: "Adopted by 600+ engineers, improving ticket resolution by 35%",
    tags: ["RAG", "LLMs", "Python"],
    icon: Bot,
    featured: true,
    origin: "Black Sesame Technologies",
  },
  {
    slug: "compiler-log-troubleshooting",
    title: "LLM Tools for Compiler-Log Troubleshooting",
    cardTitle: "Compiler-Log Troubleshooting",
    description: "LLM-based tools that analyze model-compiler logs and help engineers fix model-conversion errors.",
    category: "AI",
    problem: "Model-conversion errors meant digging through compiler logs by hand",
    solution: "Developed LLM-based tools for compiler-log analysis and troubleshooting",
    outcome: "Helped resolve approximately 40% of common model-conversion errors",
    tags: ["LLMs", "AI agents", "Python"],
    icon: FileSearch,
    featured: true,
    origin: "Black Sesame Technologies",
  },
  {
    slug: "llm-inference-serving",
    title: "LLM Inference Serving on vLLM and Kubernetes",
    cardTitle: "LLM Inference Serving",
    description: "LLM inference services optimized with vLLM, dynamic batching, and autoscaling on Kubernetes.",
    category: "MLOps",
    problem: "Serving LLM queries on GPUs was expensive per query",
    solution: "Optimized the inference services with vLLM, dynamic batching, and Kubernetes autoscaling",
    outcome: "GPU cost per query cut by 50%",
    tags: ["vLLM", "Kubernetes", "Dynamic batching", "Autoscaling"],
    icon: Gauge,
    featured: true,
    origin: "Black Sesame Technologies",
  },

  // FiberHome Technologies: AI operations for telecommunications infrastructure
  {
    slug: "telemetry-anomaly-detection",
    title: "Anomaly Detection over 2 Billion Telemetry Records a Day",
    cardTitle: "Telemetry Anomaly Detection",
    description:
      "LSTM and Isolation Forest models analyzing more than two billion telemetry records a day from telecommunications infrastructure.",
    category: "ML",
    problem: "Network faults had to be caught in more than two billion telemetry records a day",
    solution: "Built anomaly detection with LSTM and Isolation Forest, and predictive monitoring for link degradation",
    outcome: "Potential link degradation flagged about 30 minutes earlier, helping reduce outages by 25%",
    tags: ["LSTM", "Isolation Forest", "Python", "Predictive monitoring"],
    icon: Activity,
    featured: true,
    origin: "FiberHome Technologies",
  },
  {
    slug: "root-cause-analysis",
    title: "Root-Cause Analysis for Network Alarms",
    cardTitle: "Root-Cause Analysis",
    description: "Root-cause analysis workflows for telecom operations, cutting alarm noise and time to repair.",
    category: "ML",
    solution: "Implemented root-cause analysis workflows over the network's alarms",
    outcome: "Alarm noise down 70% and mean time to repair (MTTR) down 40%",
    tags: ["Machine learning", "Telecom operations"],
    icon: BellOff,
    origin: "FiberHome Technologies",
  },
  {
    slug: "bert-ticket-routing",
    title: "BERT Ticket Classification and Routing",
    cardTitle: "BERT Ticket Routing",
    description: "A BERT-based system that classifies operations tickets and routes them.",
    category: "ML",
    solution: "Developed a BERT-based ticket classification and routing system",
    outcome: "91% accuracy, saving an estimated 3,000 engineering hours a year",
    tags: ["BERT", "NLP", "Python"],
    icon: Split,
    origin: "FiberHome Technologies",
  },
  {
    slug: "realtime-streaming-pipelines",
    title: "Real-Time Pipelines on Kafka and Flink",
    cardTitle: "Streaming Pipelines",
    description: "Real-time data pipelines on Kafka and Flink feeding the prediction workflows.",
    category: "Data",
    solution: "Built real-time data pipelines using Kafka and Flink",
    outcome: "Prediction workflows supported with sub-second processing latency",
    tags: ["Kafka", "Flink", "Streaming"],
    icon: Workflow,
    origin: "FiberHome Technologies",
  },
  {
    slug: "telecom-microservices",
    title: "Go and Java Microservices at 10,000+ Requests per Second",
    cardTitle: "Microservices at 10k RPS",
    description:
      "Go and Java microservices in Kubernetes environments, each capable of more than 10,000 requests per second.",
    category: "Backend",
    solution: "Developed Go and Java microservices and ran them in Kubernetes environments",
    outcome: "Capable of handling more than 10,000 requests per second",
    tags: ["Go", "Java", "Kubernetes", "Microservices"],
    icon: Server,
    origin: "FiberHome Technologies",
  },
  {
    slug: "mlflow-model-lifecycle",
    title: "MLflow Model Lifecycle",
    cardTitle: "MLflow Model Lifecycle",
    description: "MLflow-based model lifecycle workflows for training, registering, and releasing models.",
    category: "MLOps",
    problem: "Releasing a new model version took four weeks",
    solution: "Implemented MLflow-based model lifecycle workflows",
    outcome: "Model release cycle cut from four weeks to one",
    tags: ["MLflow", "MLOps", "Python"],
    icon: GitBranch,
    origin: "FiberHome Technologies",
  },

  // Yangtze Memory Technologies: semiconductor manufacturing
  {
    slug: "wafer-defect-classification",
    title: "ResNet Wafer Defect Classification",
    cardTitle: "Wafer Defect Classification",
    description: "A ResNet-based classifier for semiconductor wafer defect inspection.",
    category: "ML",
    problem: "Wafer defects were reviewed manually",
    solution: "Developed a ResNet-based wafer defect classification system",
    outcome: "95% accuracy, automating approximately 60% of manual defect review",
    tags: ["ResNet", "PyTorch", "Computer vision"],
    icon: Microscope,
    featured: true,
    origin: "Yangtze Memory Technologies",
  },
  {
    slug: "manufacturing-anomaly-detection",
    title: "Manufacturing Anomaly Detection",
    cardTitle: "Manufacturing Anomaly Detection",
    description: "Anomaly detection that identifies manufacturing irregularities and supports process optimization.",
    category: "ML",
    solution: "Implemented anomaly detection over manufacturing process data",
    outcome: "Contributed to a 2% yield improvement",
    tags: ["Anomaly detection", "Python", "Process data"],
    icon: TrendingUp,
    origin: "Yangtze Memory Technologies",
  },
  {
    slug: "manufacturing-data-platform",
    title: "MES Data Services, Spark Pipelines, and Engineering Dashboards",
    cardTitle: "Manufacturing Data Platform",
    description:
      "Python and Java services for manufacturing execution system (MES) data, Spark and Hive pipelines for analytics, and React dashboards for engineers.",
    category: "Full-stack",
    solution:
      "Built MES data services, Apache Spark and Hive pipelines for analytics and reporting, and React dashboards for manufacturing data and defect analysis",
    outcome: "Millions of records processed a day; dashboards used by 100+ engineers",
    tags: ["Python", "Java", "Apache Spark", "Hive", "React"],
    icon: Database,
    origin: "Yangtze Memory Technologies",
  },
];

/** What the Work section shows, by slug, newest employer first */
export const WORK = {
  automotive: [
    "int8-perception-models",
    "cuda-kernels",
    "rag-documentation-assistant",
    "compiler-log-troubleshooting",
    "llm-inference-serving",
  ],
  telecom: [
    "telemetry-anomaly-detection",
    "root-cause-analysis",
    "bert-ticket-routing",
    "realtime-streaming-pipelines",
    "telecom-microservices",
    "mlflow-model-lifecycle",
  ],
  manufacturing: ["wafer-defect-classification", "manufacturing-anomaly-detection", "manufacturing-data-platform"],
} as const;

/** Every project the Work section shows, in order */
export const WORK_ORDER: readonly string[] = [...WORK.automotive, ...WORK.telecom, ...WORK.manufacturing];

export const projectBySlug = (slug: string) => {
  const found = projects.find((p) => p.slug === slug);
  if (!found) throw new Error(`Unknown project: ${slug}`);
  return found;
};
