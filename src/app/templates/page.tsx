"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePolicyStore } from "@/store/policyStore";
import { useToast } from "@/components/ui/Toast";
import { PageTransition, FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/Animations";
import type { PolicyCategory } from "@/types";
import {
  FileText,
  Shield,
  Lock,
  Users,
  Scale,
  Leaf,
  DollarSign,
  Heart,
  Briefcase,
  ArrowRight,
  Sparkles,
  Eye,
  X,
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  category: PolicyCategory;
  icon: React.ReactNode;
  tags: string[];
  content: string;
}

const TEMPLATES: Template[] = [
  {
    id: "privacy-general",
    title: "General Privacy Policy",
    description: "Comprehensive privacy policy covering data collection, storage, and user rights under GDPR and CCPA frameworks.",
    category: "Privacy",
    icon: <Shield className="h-5 w-5" />,
    tags: ["GDPR", "CCPA", "Data Protection"],
    content: `PRIVACY POLICY

Last Updated: [DATE]

1. INTRODUCTION
This Privacy Policy describes how [ORGANIZATION] ("we", "our", "us") collects, uses, stores, and shares your personal information when you use our services.

2. INFORMATION WE COLLECT
2.1 Personal Information: Name, email address, phone number, and billing information.
2.2 Usage Data: IP address, browser type, pages visited, time and date of visit.
2.3 Cookies and Tracking: We use cookies and similar technologies to track activity and hold certain information.

3. HOW WE USE YOUR INFORMATION
- To provide, maintain, and improve our services
- To communicate with you about updates and offers
- To comply with legal obligations
- To detect, prevent, and address technical issues

4. DATA RETENTION
We retain personal data only as long as necessary for the purposes outlined in this policy, typically [X] months/years from your last interaction.

5. YOUR RIGHTS (GDPR/CCPA)
- Right to access your personal data
- Right to rectification of inaccurate data
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object to processing
- Right to opt-out of sale of personal information (CCPA)

6. DATA SECURITY
We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.

7. THIRD-PARTY SHARING
We do not sell your personal information. We may share data with trusted service providers who assist in operating our services, subject to confidentiality agreements.

8. CHILDREN'S PRIVACY
Our services are not directed to children under 13. We do not knowingly collect personal information from children.

9. CHANGES TO THIS POLICY
We may update this policy periodically. We will notify you of material changes via email or prominent notice.

10. CONTACT US
For questions about this policy, contact us at: [CONTACT EMAIL]`,
  },
  {
    id: "security-infosec",
    title: "Information Security Policy",
    description: "Enterprise-grade information security policy aligned with ISO 27001 and NIST frameworks.",
    category: "Security",
    icon: <Lock className="h-5 w-5" />,
    tags: ["ISO 27001", "NIST", "InfoSec"],
    content: `INFORMATION SECURITY POLICY

Version: 1.0 | Effective Date: [DATE]

1. PURPOSE
This policy establishes the framework for protecting [ORGANIZATION]'s information assets from all threats, whether internal or external, deliberate or accidental.

2. SCOPE
This policy applies to all employees, contractors, consultants, temporaries, and other workers at [ORGANIZATION], including all personnel affiliated with third parties.

3. CLASSIFICATION OF INFORMATION
3.1 Confidential: Trade secrets, financial data, customer PII
3.2 Internal: Internal communications, procedures, policies
3.3 Public: Marketing materials, published reports

4. ACCESS CONTROL
- All access must follow the principle of least privilege
- Multi-factor authentication (MFA) required for all critical systems
- Access reviews conducted quarterly
- Immediate revocation upon role change or termination

5. DATA PROTECTION
- Encryption at rest (AES-256) and in transit (TLS 1.2+)
- Regular backups with tested recovery procedures
- Data loss prevention (DLP) controls on all endpoints

6. INCIDENT RESPONSE
6.1 Detection and reporting within 1 hour of discovery
6.2 Initial assessment and containment within 4 hours
6.3 Full investigation within 24 hours
6.4 Notification to affected parties within 72 hours (per GDPR)

7. NETWORK SECURITY
- Firewall rules reviewed monthly
- Intrusion detection/prevention systems (IDS/IPS) active
- Network segmentation between environments
- VPN required for remote access

8. EMPLOYEE RESPONSIBILITIES
- Complete annual security awareness training
- Report suspicious activities immediately
- Do not share credentials or access tokens
- Lock workstations when unattended

9. COMPLIANCE
This policy aligns with ISO 27001, NIST Cybersecurity Framework, SOC 2 Type II requirements.

10. REVIEW
This policy will be reviewed annually or after any significant security incident.`,
  },
  {
    id: "hr-employee",
    title: "Employee Handbook Policy",
    description: "Standard HR policy covering employment terms, benefits, conduct expectations, and workplace guidelines.",
    category: "HR",
    icon: <Users className="h-5 w-5" />,
    tags: ["Employment", "Conduct", "Benefits"],
    content: `EMPLOYEE HANDBOOK

Effective: [DATE]

1. WELCOME
Welcome to [ORGANIZATION]. This handbook outlines our policies, benefits, and expectations for all employees.

2. EMPLOYMENT POLICIES
2.1 Equal Opportunity: We are an equal opportunity employer and do not discriminate based on race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.
2.2 At-Will Employment: Employment is at-will unless otherwise specified in a written agreement.
2.3 Background Checks: All offers are contingent upon successful background verification.

3. COMPENSATION AND BENEFITS
- Competitive salary reviewed annually
- Health, dental, and vision insurance
- 401(k) with employer match
- Paid time off: [X] days vacation, [X] sick days, [X] personal days
- Parental leave: [X] weeks paid leave

4. WORK SCHEDULE AND ATTENDANCE
- Standard hours: 9:00 AM to 5:00 PM
- Flexible work arrangements available upon manager approval
- Remote work policy in effect
- Punctuality and regular attendance expected

5. CODE OF CONDUCT
- Treat all colleagues with respect and professionalism
- Maintain confidentiality of company information
- Avoid conflicts of interest
- Comply with all applicable laws and regulations
- Zero tolerance for harassment or discrimination

6. PERFORMANCE MANAGEMENT
- Annual performance reviews
- Quarterly goal-setting and check-ins
- Professional development budget: $[X] per employee per year

7. TERMINATION
- Voluntary: Two weeks notice preferred
- Involuntary: Progressive discipline process followed except in cases of gross misconduct
- Exit interview conducted for all departures

8. ACKNOWLEDGMENT
By signing below, you acknowledge receipt and understanding of this handbook.`,
  },
  {
    id: "compliance-aml",
    title: "Anti-Money Laundering (AML) Policy",
    description: "AML compliance policy covering KYC procedures, transaction monitoring, and suspicious activity reporting.",
    category: "Compliance",
    icon: <Scale className="h-5 w-5" />,
    tags: ["AML", "KYC", "Financial Crime"],
    content: `ANTI-MONEY LAUNDERING (AML) POLICY

1. PURPOSE
This policy establishes procedures to prevent the use of [ORGANIZATION]'s services for money laundering or terrorist financing activities.

2. REGULATORY FRAMEWORK
This policy complies with the Bank Secrecy Act (BSA), USA PATRIOT Act, Financial Action Task Force (FATF) recommendations, and applicable local regulations.

3. KNOW YOUR CUSTOMER (KYC)
3.1 Customer Identification Program (CIP):
- Government-issued photo ID required
- Verification of identity through independent sources
- Beneficial ownership identification for entities

3.2 Customer Due Diligence (CDD):
- Risk assessment for all new customers
- Enhanced due diligence for high-risk customers
- Ongoing monitoring of customer relationships

4. TRANSACTION MONITORING
- Automated systems monitor all transactions
- Thresholds: Cash transactions ≥ $10,000 reported (CTR)
- Suspicious patterns flagged for review
- Wire transfers screened against sanctions lists

5. SUSPICIOUS ACTIVITY REPORTING
- SAR filed within 30 days of detection
- Internal escalation procedures documented
- No tipping off of subjects
- Records maintained for minimum 5 years

6. SANCTIONS SCREENING
- All customers screened against OFAC, UN, and EU sanctions lists
- Real-time screening for wire transfers
- Periodic re-screening of existing customer base

7. TRAINING
- All employees: Annual AML awareness training
- Compliance team: Specialized quarterly training
- New hires: AML training within 30 days

8. RECORD KEEPING
- All records maintained for minimum 5 years
- Readily accessible for regulatory examination
- Secure storage with appropriate access controls`,
  },
  {
    id: "environmental-sustainability",
    title: "Environmental Sustainability Policy",
    description: "Corporate environmental policy covering emissions targets, waste reduction, and sustainability commitments.",
    category: "Environmental",
    icon: <Leaf className="h-5 w-5" />,
    tags: ["ESG", "Carbon Neutral", "Sustainability"],
    content: `ENVIRONMENTAL SUSTAINABILITY POLICY

1. COMMITMENT
[ORGANIZATION] is committed to minimizing our environmental impact and promoting sustainable practices across all operations.

2. OBJECTIVES
- Achieve carbon neutrality by [YEAR]
- Reduce waste to landfill by 90% by [YEAR]
- Source 100% renewable energy by [YEAR]
- Implement circular economy principles

3. EMISSIONS MANAGEMENT
3.1 Scope 1: Direct emissions from owned sources
3.2 Scope 2: Indirect emissions from purchased electricity
3.3 Scope 3: Value chain emissions
- Annual greenhouse gas inventory
- Science-based targets aligned with Paris Agreement
- Carbon offset program for unavoidable emissions

4. RESOURCE EFFICIENCY
- Energy audits conducted annually
- LED lighting and smart building systems
- Water conservation measures
- Paperless office initiative

5. WASTE MANAGEMENT
- Reduce, reuse, recycle hierarchy
- E-waste recycling program
- Composting in all facilities
- Single-use plastic elimination

6. SUPPLY CHAIN
- Environmental criteria in vendor selection
- Supplier sustainability assessments
- Local sourcing where feasible
- Green procurement guidelines

7. REPORTING
- Annual sustainability report published
- CDP (Carbon Disclosure Project) participation
- GRI Standards compliance
- Third-party verification of emissions data

8. EMPLOYEE ENGAGEMENT
- Green team champions in each department
- Sustainability training for all employees
- Incentives for sustainable commuting
- Annual environmental awareness events`,
  },
  {
    id: "ethics-ai",
    title: "AI Ethics & Governance Policy",
    description: "Responsible AI policy covering fairness, transparency, accountability, and ethical AI deployment guidelines.",
    category: "Ethics",
    icon: <Heart className="h-5 w-5" />,
    tags: ["AI Ethics", "Responsible AI", "Governance"],
    content: `AI ETHICS AND GOVERNANCE POLICY

1. PURPOSE
This policy establishes principles and guidelines for the ethical development, deployment, and use of artificial intelligence systems at [ORGANIZATION].

2. CORE PRINCIPLES
2.1 Fairness: AI systems must not discriminate based on protected characteristics
2.2 Transparency: AI decision-making processes must be explainable
2.3 Accountability: Clear ownership and responsibility for AI outcomes
2.4 Privacy: AI systems must respect data privacy and protection laws
2.5 Safety: AI systems must be safe and robust against adversarial attacks

3. RISK ASSESSMENT
- All AI projects require ethical impact assessment before deployment
- Risk classification: Low, Medium, High, Critical
- High/Critical risk AI requires AI Ethics Board approval
- Regular reassessment throughout AI lifecycle

4. BIAS AND FAIRNESS
- Bias testing required before deployment
- Diverse and representative training data
- Regular audits for disparate impact
- Remediation plans for identified biases

5. TRANSPARENCY AND EXPLAINABILITY
- Model cards for all deployed AI systems
- Human-readable explanations for AI decisions
- Right to human review of automated decisions
- Clear disclosure when users interact with AI

6. DATA GOVERNANCE
- Training data must be lawfully obtained
- Data quality standards enforced
- Data provenance documentation required
- Regular data drift monitoring

7. HUMAN OVERSIGHT
- Human-in-the-loop for high-stakes decisions
- Kill switch capability for all AI systems
- Escalation procedures for anomalous behavior
- Regular human review of AI outputs

8. COMPLIANCE
Aligned with EU AI Act, NIST AI Risk Management Framework, and IEEE Ethically Aligned Design principles.`,
  },
  {
    id: "financial-expense",
    title: "Expense & Reimbursement Policy",
    description: "Financial policy covering expense guidelines, approval workflows, and reimbursement procedures.",
    category: "Financial",
    icon: <DollarSign className="h-5 w-5" />,
    tags: ["Expenses", "Travel", "Reimbursement"],
    content: `EXPENSE AND REIMBURSEMENT POLICY

1. PURPOSE
This policy provides guidelines for business-related expenses and the reimbursement process at [ORGANIZATION].

2. GENERAL PRINCIPLES
- Expenses must be reasonable, necessary, and business-related
- Prior approval required for expenses over $[THRESHOLD]
- Original receipts required for all expenses over $25
- Expense reports submitted within 30 days of expense

3. TRAVEL EXPENSES
3.1 Air Travel: Economy class for flights under 6 hours; business class for international flights over 6 hours with VP approval
3.2 Hotels: Up to $[X] per night in standard markets; $[X] in high-cost cities
3.3 Ground Transportation: Reasonable taxi/rideshare; rental car with prior approval
3.4 Per Diem: $[X] for meals and incidentals

4. ENTERTAINMENT AND MEALS
- Business meals: Up to $[X] per person
- Client entertainment: Prior approval from department head
- Team events: Up to $[X] per person per event
- Alcohol: Reasonable consumption with meals only

5. TECHNOLOGY AND EQUIPMENT
- Standard equipment provided by IT
- Personal device stipend: $[X] per month (if enrolled in BYOD)
- Software purchases require IT approval

6. APPROVAL WORKFLOW
- Under $500: Direct manager approval
- $500 - $5,000: Director approval
- Over $5,000: VP approval
- Over $25,000: CFO approval

7. REIMBURSEMENT PROCESS
- Submit via expense management system
- Attach all required documentation
- Processing time: 10 business days after approval
- Direct deposit to employee's bank account

8. NON-REIMBURSABLE EXPENSES
- Personal travel extensions
- Traffic violations and parking tickets
- Personal phone charges (unless BYOD enrolled)
- Gym memberships (covered under wellness program separately)`,
  },
  {
    id: "security-incident",
    title: "Incident Response Plan",
    description: "Cybersecurity incident response plan with escalation procedures, communication templates, and recovery steps.",
    category: "Security",
    icon: <Briefcase className="h-5 w-5" />,
    tags: ["Incident Response", "CSIRT", "Recovery"],
    content: `CYBERSECURITY INCIDENT RESPONSE PLAN

1. PURPOSE
This plan establishes procedures for detecting, responding to, and recovering from cybersecurity incidents at [ORGANIZATION].

2. INCIDENT CLASSIFICATION
2.1 Level 1 (Low): Malware on single endpoint, phishing attempt blocked
2.2 Level 2 (Medium): Successful phishing, unauthorized access attempt
2.3 Level 3 (High): Data breach, ransomware, system compromise
2.4 Level 4 (Critical): Widespread breach, critical infrastructure down

3. INCIDENT RESPONSE TEAM
- Incident Commander: CISO
- Technical Lead: Senior Security Engineer
- Communications Lead: VP Communications
- Legal Counsel: General Counsel
- Business Continuity: COO

4. RESPONSE PHASES
4.1 DETECTION (0-1 hour)
- Security monitoring alerts triaged
- Initial assessment by on-call analyst
- Incident ticket created and classified

4.2 CONTAINMENT (1-4 hours)
- Isolate affected systems
- Preserve evidence
- Block malicious IPs/domains
- Disable compromised accounts

4.3 ERADICATION (4-24 hours)
- Remove malware/backdoors
- Patch exploited vulnerabilities
- Reset compromised credentials
- Verify system integrity

4.4 RECOVERY (24-72 hours)
- Restore from clean backups
- Gradual system restoration
- Enhanced monitoring period
- User communication and password resets

4.5 LESSONS LEARNED (1-2 weeks post-incident)
- Incident timeline documentation
- Root cause analysis
- Control gap identification
- Policy and procedure updates

5. COMMUNICATION
- Internal: Notify executive team within 2 hours for Level 3+
- External: Legal review before any external communication
- Regulatory: Notify within 72 hours per GDPR requirements
- Law Enforcement: CISO decision for Level 3+ incidents

6. TESTING
- Tabletop exercises quarterly
- Full simulation annually
- Plan review after each real incident`,
  },
];

function TemplateCard({ template, onPreview, onUse }: { template: Template; onPreview: () => void; onUse: () => void }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-white/[0.06] bg-zinc-900/60 p-5 transition-all hover:border-white/[0.1] hover:bg-zinc-900/80">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
          {template.icon}
        </div>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
          {template.category}
        </span>
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-white">{template.title}</h3>
      <p className="mb-3 flex-1 text-xs leading-relaxed text-zinc-400">{template.description}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {template.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPreview}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <Eye className="h-3 w-3" />
          Preview
        </button>
        <button
          onClick={onUse}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <Sparkles className="h-3 w-3" />
          Use template
        </button>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | "All">("All");
  const [preview, setPreview] = useState<Template | null>(null);
  const { addPolicy, selectPolicy, logActivity } = usePolicyStore();
  const { toast } = useToast();
  const router = useRouter();

  const categories: (PolicyCategory | "All")[] = ["All", "Privacy", "Security", "HR", "Compliance", "Environmental", "Financial", "Ethics"];

  const filtered = selectedCategory === "All"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleUse = (template: Template) => {
    const policy = addPolicy(template.title, template.content, template.category);
    selectPolicy(policy.id);
    logActivity("template_used", `Used template "${template.title}"`, template.category, policy.id, template.title);
    toast({ title: `Created from "${template.title}" template`, variant: "success" });
    router.push("/dashboard");
  };

  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <FadeInView>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Policy Templates</h1>
              <p className="text-sm text-zinc-400">Start with a professional template and customize it for your needs</p>
            </div>
          </div>
        </FadeInView>

        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => (
            <StaggerItem key={template.id}>
              <TemplateCard
                template={template}
                onPreview={() => setPreview(template)}
                onUse={() => handleUse(template)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <FileText className="mx-auto h-10 w-10 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">No templates in this category</p>
          </div>
        )}

        {/* Preview modal */}
        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{preview.title}</h3>
                  <p className="text-xs text-zinc-400">{preview.category} • {preview.tags.join(", ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { handleUse(preview); setPreview(null); }}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    <Sparkles className="h-3 w-3" />
                    Use template
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setPreview(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 4rem)" }}>
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300 font-mono">
                  {preview.content}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  );
}
