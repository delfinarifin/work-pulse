-- Retarget the demo domain from generic enterprise consulting to tax & accounting
-- consulting. Updates existing seed rows in place (same ids) so FK references from
-- activities/timesheet_entries stay intact — no schema change, data only.

update teams set name = 'Tax Advisory' where id = 'a0000000-0000-4000-8000-000000000001';
update teams set name = 'Audit & Assurance' where id = 'a0000000-0000-4000-8000-000000000002';

update job_roles set title = 'Tax Consultant' where id = 'b0000000-0000-4000-8000-000000000001';
update job_roles set title = 'Senior Accountant' where id = 'b0000000-0000-4000-8000-000000000002';
update job_roles set title = 'Audit Manager' where id = 'b0000000-0000-4000-8000-000000000003';

update work_types set label = 'Tax Preparation', category = 'Tax',
  keywords = array['tax','spt','pph','ppn','faktur','return','1040','1120','w2','1099']
  where id = 'c0000000-0000-4000-8000-000000000001';
update work_types set label = 'Bookkeeping', category = 'Accounting',
  keywords = array['ledger','journal','jurnal','reconciliation','recon','gl','coa','buku_besar']
  where id = 'c0000000-0000-4000-8000-000000000002';
update work_types set label = 'Audit', category = 'Assurance',
  keywords = array['audit','workpaper','wp','fieldwork','engagement','sampling']
  where id = 'c0000000-0000-4000-8000-000000000003';
update work_types set label = 'Advisory', category = 'Consulting',
  keywords = array['memo','advisory','planning','opinion','strategy','structuring']
  where id = 'c0000000-0000-4000-8000-000000000004';
update work_types set label = 'Financial Reporting', category = 'Reporting',
  keywords = array['financial_statement','balance_sheet','income_statement','cashflow','budget','forecast','laporan','report']
  where id = 'c0000000-0000-4000-8000-000000000005';

update activities set file_name = 'Tax_Return_Client_ABC_2024.docx', application = 'Word',
  work_type_value = 'Tax Preparation', project_label = 'Acme Corp'
  where id = 'e0000000-0000-4000-8000-000000000001';
update activities set file_name = 'Budget_Forecast_2025.xlsx', application = 'Excel',
  work_type_value = 'Financial Reporting', project_label = 'Acme Corp'
  where id = 'e0000000-0000-4000-8000-000000000002';
update activities set file_name = 'Bank_Reconciliation_Nov2024.xlsx', application = 'Excel',
  work_type_value = 'Bookkeeping', project_label = 'Globex Corp'
  where id = 'e0000000-0000-4000-8000-000000000003';
update activities set file_name = 'Audit_Workpaper_Q4_2024.pdf', application = 'Adobe Acrobat',
  work_type_value = 'Audit', project_label = 'Initech Corp'
  where id = 'e0000000-0000-4000-8000-000000000004';
update activities set file_name = 'Audit_Fieldwork_Sampling.pdf', application = 'Adobe Acrobat',
  work_type_value = 'Audit', project_label = 'Initech Corp'
  where id = 'e0000000-0000-4000-8000-000000000005';
update activities set file_name = 'Tax_Planning_Advisory_Memo.docx', application = 'Word',
  work_type_value = 'Advisory', project_label = 'Umbrella Group'
  where id = 'e0000000-0000-4000-8000-000000000006';

update audit_logs set metadata = '{"work_type": "Tax Preparation", "confidence": 0.85}'::jsonb
  where target_id = 'e0000000-0000-4000-8000-000000000001' and action = 'activity.classified';
