import { useMemo } from 'react';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { achFormFileName, generateAchFormPdf } from '../services/achFormPdfService';
import { writeDocumentToCache } from '../services/documentFileService';
import { AchInfo } from '../types/paymentSettings';
import { AsyncResource, useAsyncResource } from './useAsyncResource';

export interface AchFormFile {
  /** Where the PDF was written in the cache, for the viewer, saving, printing and sharing. */
  path: string;
  fileName: string;
}

/** Builds the company's ACH form PDF for `ach`, signed by the user, and writes it to the cache (again whenever `ach` changes). */
export function useAchFormFile(ach: AchInfo): AsyncResource<AchFormFile> {
  const { company, signature } = useSubcontractorSession();
  const load = useMemo(
    () =>
      company
        ? async (): Promise<AchFormFile> => {
            const fileName = achFormFileName(company.name);
            const contentBase64 = await generateAchFormPdf({ company, ach, signature });
            return { fileName, path: await writeDocumentToCache({ fileName, contentBase64 }) };
          }
        : null,
    [company, ach, signature],
  );
  return useAsyncResource(load);
}
