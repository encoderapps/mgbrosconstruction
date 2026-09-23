// Transcribed verbatim from the reference Master Subcontract Agreement design.
// NOTE: the reference only shows page 1 of the agreement (it ends mid-sentence
// in clause 6, with a page-1 footer). Paste the remaining pages here once the
// full document is available — do not extend this text with invented clauses.
export const MASTER_SUBCONTRACT_AGREEMENT = `MASTER SUBCONTRACT AGREEMENT

This master subcontract agreement (the "Master Subcontract" or "Subcontract") is executed on the date last written below, by and between MG Bros Construction, Inc. (the "Contractor") and High Tech Air Inc (the "Subcontractor", and together with Contractor, the "Parties"). In consideration of the terms and conditions provided below, the Parties agree as follows:

1. Use of Master Subcontract. This master subcontract agreement may be entered in one or more purchase orders ("Purchase Order" or "Purchase Orders") issued by MG Bros Construction, Inc. to the Subcontractor on a project-by-project basis. Each such Purchase Order shall identify the "Project" and the "Owner", describe the Subcontractor's scope of work (the "Scope of Work" or "Work"), and specify the "Subcontract Price." Each such Purchase Order may specify the anticipated start of construction, the scheduled completion of Subcontractor's construction operations (collectively, the "Subcontract Time"), and/or the scheduled date of "Substantial Completion." Each such Purchase Order and the respective Contract Documents that govern the Project and the Work.

2. Incorporation by Purchase Order Reference. When this Subcontract is referenced in a Purchase Order, or when reference is made in a Purchase Order to "the subcontract," the "agreement between MG and the subcontractor" or any similar reference, then this Subcontract and the respective Contract Documents, if any, are thereby incorporated by reference into such Purchase Order, and this Subcontract and the respective Contract Documents apply to all labor, materials, equipment, work, services, and other deliverables delivered, performed, furnished, and/or installed by the Subcontractor in connection with that Purchase Order.

3. Contract Documents. The Contract Documents identified in a Purchase Order may include, without limitation, the Project Manual; the Drawings; the Specifications; the General and Supplemental Conditions, if applicable; the General Contract between Owner and Contractor; and all Change Orders and Construction Change Directives executed by Owner and Contractor (collectively the "Contract Documents"). If a conflict arises between any provision of the Contract Documents and this Subcontract, this Subcontract shall control to the extent of that conflict.

4. Subcontractor's Investigation. Subcontractor represents that it has received, examined, and fully understands this Subcontract and the other Contract Documents; that it has investigated the nature, locality and Project site and the conditions and difficulties under which the Work is to be performed; and that it enters into this Subcontract on the basis of its own examination, investigation and evaluation of all such elements of the Project and not in reliance upon any opinions or representations of Contractor, or of Owner or Architect, or of any of their respective officers, employees, or agents, except to the extent contained in the Contract Documents.

5. Scope of Work. Subcontractor shall timely furnish, install, and complete all the Work in accordance with the Contract Documents and this Subcontract, including but not limited to all labor, materials, equipment, appliances, supervision, services, and all other things necessary for the incorporation into the Project.

6. Details of the Work. Notwithstanding the dimensions given on the Drawings, Specifications and other Contract Documents, it shall be the obligation and responsibility of the`;

export interface PolicyTermsSection {
  title: string;
  // TODO: clause 8's body is partially obscured behind the device UI in the
  // reference screenshot — only the closing fragment "...resulting from your
  // use of the App." is legible. Fill in the missing opening sentence(s) once
  // the full wording is available; do not invent the missing text.
  body: string;
}

export const ACCEPT_POLICY_TERMS_SECTIONS: PolicyTermsSection[] = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using MG Bros Construction, Inc. Subcontractor Portal ("the App"), you agree to be bound by these Terms. If you do not agree, do not use the App.',
  },
  {
    title: '2. User Accounts',
    body: 'You must provide accurate and complete information when creating an account. You are entirely responsible for maintaining the confidentiality of your login credentials. You must notify us immediately of any unauthorized use or security breach of your account.',
  },
  {
    title: '3. License to Use',
    body: 'We grant you a limited, non-exclusive, non-transferable, and revocable license to use the App for personal or internal business purposes. You may not reverse engineer, modify, or distribute any part of the App.',
  },
  {
    title: '4. User-Generated Content',
    body: 'You retain ownership of any text, photos, or data you upload to the App. You grant us a worldwide, royalty-free license to host, store, and display your content solely to provide the App services. Prohibited content includes illegal, abusive, defamatory, or infringing materials.',
  },
  {
    title: '5. Prohibited Conduct',
    body: 'You agree not to use the App to: Violate any local, state, national, or international laws. Deploy viruses, malware, or spamming scripts. Interfere with or disrupt the security and servers of the App.',
  },
  {
    title: '6. Intellectual Property',
    body: 'All app designs, code, logos, and trademarks are the exclusive property of MG Bros Construction, Inc.',
  },
  {
    title: '7. Termination',
    body: 'We reserve the right to suspend or terminate your account at any time, without notice, for conduct that violates these Terms or harms other users.',
  },
  {
    title: '8. Disclaimers & Limitation of Liability',
    body: '… resulting from your use of the App.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We may update these Terms periodically. We will notify you of material changes via email or an in-app alert. Continued use after updates constitutes acceptance.',
  },
];
