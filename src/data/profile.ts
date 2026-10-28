/**
 * Your GitHub username, e.g. "yuminchen". It turns on the "Experiments" repo list, the "Latest on
 * GitHub" card, and the GitHub links. Empty hides all of them. scripts/snapshot-github.mjs reads it too.
 */
const GITHUB_USER: string = "devsmilegod";

/**
 * Your own domain, e.g. "yuminchen.com" (no https://, no slash). Empty serves the site from GitHub
 * Pages at /Portfolio/. Set, the site moves to the root of that domain and the build writes the
 * CNAME file GitHub Pages needs. Point the domain's DNS at GitHub first (see README, "Custom domain").
 */
export const CUSTOM_DOMAIN: string = "uminnos.net";

/** The path the built site is served under: the domain's root, or /Portfolio/ on github.io */
export const BASE_PATH = CUSTOM_DOMAIN ? "/" : "/Portfolio/";

/** Where the site lives, with a trailing slash. Used for the canonical URL and social-card tags. */
export const SITE_URL = CUSTOM_DOMAIN
  ? `https://${CUSTOM_DOMAIN}/`
  : GITHUB_USER
    ? `https://${GITHUB_USER.toLowerCase()}.github.io/Portfolio/`
    : "/Portfolio/";

/** The person, as the site introduces them. Facts only, all from the résumé; nothing here is invented. */
export const PROFILE = {
  name: "Yumin Chen",
  first: "Yumin",
  last: "Chen",
  title: "Software Engineer",
  /** The second half of the hero's label: "Software Engineer · AI Engineer" */
  focus: "AI Engineer",
  email: "yuminchennas@gmail.com",
  /** Under public/, relative to BASE_URL */
  resume: "yumin-chen-resume.pdf",
  resumeDownloadName: "yumin-chen-resume.pdf",
  city: "Wuhan, China",
  timeZone: "Asia/Shanghai",
  /** Shown after the local time */
  timeZoneLabel: "GMT+8",
  // Midnight in Wuhan, not UTC, so the counter reads the same for every visitor
  careerStart: new Date("2018-07-01T00:00:00+08:00"),
  /** The hero statement, two lines in Antonio */
  headline: ["Production AI.", "Reliable systems."],
  /** The hero line under the statement */
  tagline:
    "Eight years taking machine learning from model to production, across autonomous-driving AI, telecommunications, and semiconductor manufacturing.",
  intro:
    "I have spent eight years taking machine learning from model to production: wafer defect classification for semiconductor manufacturing, anomaly detection over two billion telemetry records a day for telecom networks, and 30+ perception models quantized and deployed onto in-vehicle AI chips. Today I work independently on backend services, LLM applications, RAG, and AI-agent workflows.",
  githubUser: GITHUB_USER,
  /** Public profiles. Leave a value empty to hide it everywhere on the site. */
  links: {
    github: GITHUB_USER ? `https://github.com/${GITHUB_USER}` : "",
    /** Your full LinkedIn URL, e.g. "https://www.linkedin.com/in/your-handle" */
    linkedin: "https://www.linkedin.com/in/yumin-chen-64b340447/",
  },
  /** How I think: three principles */
  principles: [
    {
      title: "Measure, then optimize.",
      note: "Every speed-up starts with a profile and ends with an accuracy check. A faster model that stops seeing is not faster.",
    },
    {
      title: "Production is the test.",
      note: "A model is done when it runs on the target hardware, at the target latency, for the people who depend on it.",
    },
    {
      title: "Build what people adopt.",
      note: "A tool proves itself when engineers choose to use it. I build for the person on the other end of the API.",
    },
  ],
  /** Closes the Experience list */
  education: {
    year: "2014 – 2018",
    title: "Bachelor of Engineering",
    org: "Huazhong University of Science and Technology Wuchang Branch",
  },
} as const;

/** The public profiles, in the order the site lists them; empty ones are left out */
export const SOCIALS: readonly { label: string; href: string }[] = [
  { label: "LinkedIn", href: PROFILE.links.linkedin },
  { label: "GitHub", href: PROFILE.links.github },
].filter((s) => s.href !== "");

/** What I do: five services with the real stack behind each */
export const SERVICES: { title: string; blurb: string; stack: string[]; proof: { label: string; href: string }[] }[] = [
  {
    title: "Model deployment",
    blurb:
      "PyTorch models onto constrained hardware: INT8 quantization, custom C++ and CUDA kernels, and inference tuned to the chip it runs on.",
    stack: ["PyTorch", "INT8 quantization", "CUDA", "C++", "Model inference"],
    proof: [
      { label: "30+ models across five customer programs", href: "#experience" },
      { label: "3.2× lower latency with INT8", href: "#case-int8-perception-models" },
      { label: "45% more throughput from CUDA kernels", href: "#case-cuda-kernels" },
    ],
  },
  {
    title: "LLM applications",
    blurb:
      "Retrieval-augmented assistants and LLM tools grounded in your own documentation and logs, built for the engineers who use them.",
    stack: ["LLMs", "RAG", "AI agents", "Python", "FastAPI"],
    proof: [
      { label: "RAG assistant adopted by 600+ engineers", href: "#case-rag-documentation-assistant" },
      { label: "LLM compiler-log troubleshooting", href: "#case-compiler-log-troubleshooting" },
    ],
  },
  {
    title: "LLM inference at scale",
    blurb: "Serving models reliably and cheaply: vLLM, dynamic batching, and autoscaling on Kubernetes.",
    stack: ["vLLM", "Kubernetes", "Docker", "Dynamic batching", "Autoscaling"],
    proof: [{ label: "GPU cost per query cut by 50%", href: "#case-llm-inference-serving" }],
  },
  {
    title: "Data and ML pipelines",
    blurb:
      "The pipelines that feed models: Kafka and Flink in real time, Spark and Hive in batch, and MLflow to ship model releases faster.",
    stack: ["Kafka", "Flink", "Apache Spark", "Hive", "MLflow", "SQL"],
    proof: [
      { label: "2B+ telemetry records a day", href: "#case-telemetry-anomaly-detection" },
      { label: "Sub-second streaming pipelines", href: "#case-realtime-streaming-pipelines" },
      { label: "Model releases in one week, not four", href: "#case-mlflow-model-lifecycle" },
    ],
  },
  {
    title: "Backend services",
    blurb: "The Go, Java, and Python services behind the models: REST APIs and microservices built for throughput.",
    stack: ["Python", "Go", "Java", "FastAPI", "REST APIs", "React"],
    proof: [
      { label: "Microservices at 10,000+ requests per second", href: "#case-telecom-microservices" },
      { label: "Manufacturing data services and dashboards", href: "#case-manufacturing-data-platform" },
    ],
  },
];
