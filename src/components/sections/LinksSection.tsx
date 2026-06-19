import { Plus } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import type { WcmpLink } from '../../types/wcmp2';
import { LINK_RELATIONS } from '../../utils/vocabularies';
import { SectionWrapper } from './SectionWrapper';
import { LinkRow, emptyLink } from '../LinkEditor';

interface VocabItem { id: string; title: string }

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  linkRelations?: VocabItem[];
}

export function LinksSection({ form, update, linkRelations = LINK_RELATIONS }: Props) {
  const setLinks = (links: WcmpLink[]) => update('links', links);

  const addLink = () => setLinks([...form.links, emptyLink()]);

  return (
    <SectionWrapper id="links" title="Links" required>
      <p className="text-sm text-gray-500 mb-4">
        At least one link is required. Add a <code className="bg-gray-100 px-1 rounded text-xs">preview</code> link
        for a thumbnail, and a <code className="bg-gray-100 px-1 rounded text-xs">license</code> link if data policy
        is "recommended".
      </p>

      <div className="space-y-3 mb-4">
        {form.links.map((link, i) => (
          <LinkRow
            key={i}
            link={link}
            onChange={updated => {
              const next = [...form.links];
              next[i] = updated;
              setLinks(next);
            }}
            onRemove={() => setLinks(form.links.filter((_, idx) => idx !== i))}
            linkRelations={linkRelations}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addLink}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
      >
        <Plus size={16} /> Add link
      </button>
    </SectionWrapper>
  );
}
