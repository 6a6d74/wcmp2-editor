import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import type { FormState } from '../../hooks/useWcmp2Form';
import type { Contact } from '../../types/wcmp2';
import { CONTACT_ROLES } from '../../utils/vocabularies';
import { CountryPicker } from '../CountryPicker';
import { SectionWrapper } from './SectionWrapper';

interface Props {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  contactRoles?: string[];
}

function emptyContact(): Contact {
  return {
    organization: '',
    name: '',
    positionName: '',
    roles: ['pointOfContact'],
    emails: [],
    phones: [],
    addresses: [{ country: '' }],
    contactInstructions: '',
  };
}

function ContactCard({
  contact,
  index,
  onChange,
  onRemove,
  roles,
}: {
  contact: Contact;
  index: number;
  onChange: (c: Contact) => void;
  onRemove: () => void;
  roles: string[];
}) {
  const [open, setOpen] = useState(true);

  const up = (field: keyof Contact, val: unknown) =>
    onChange({ ...contact, [field]: val });

  const email = contact.emails?.[0]?.value || '';
  const phone = contact.phones?.[0]?.value || '';
  const country = contact.addresses?.[0]?.country || '';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-sm text-gray-800">
          {contact.organization || contact.name || `Contact ${index + 1}`}
          {contact.roles?.includes('host') && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">host</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="text-red-400 hover:text-red-600 p-1"
          >
            <Trash2 size={14} />
          </button>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Organisation</label>
              <input
                type="text"
                value={contact.organization || ''}
                onChange={e => up('organization', e.target.value)}
                placeholder="Organisation name"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Individual name</label>
              <input
                type="text"
                value={contact.name || ''}
                onChange={e => up('name', e.target.value)}
                placeholder="First Last"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e =>
                  up('emails', [{ value: e.target.value, roles: ['pointOfContact'] }])
                }
                placeholder="contact@example.org"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e =>
                  up('phones', [{ value: e.target.value, roles: ['voice'] }])
                }
                placeholder="+44 1632 960000"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Country{' '}
                <span className="font-normal text-gray-400">(ISO 3166-1 alpha-3)</span>
              </label>
              <CountryPicker
                value={country}
                onChange={val =>
                  up('addresses', [{ ...contact.addresses?.[0], country: val }])
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
              <input
                type="text"
                value={contact.addresses?.[0]?.city || ''}
                onChange={e =>
                  up('addresses', [{ ...contact.addresses?.[0], city: e.target.value }])
                }
                placeholder="City"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Contact instructions</label>
            <textarea
              value={contact.contactInstructions || ''}
              onChange={e => up('contactInstructions', e.target.value)}
              rows={2}
              placeholder="How to get in touch (e.g. email preferred, office hours)"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Roles</label>
            <div className="flex flex-wrap gap-1.5">
              {roles.slice(0, 12).map(role => {
                const active = contact.roles?.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      const current = contact.roles || [];
                      up('roles', active ? current.filter(r => r !== role) : [...current, role]);
                    }}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ContactsSection({ form, update, contactRoles = CONTACT_ROLES }: Props) {
  const [cloneOpen, setCloneOpen] = useState(false);
  const cloneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cloneOpen) return;
    const handler = (e: MouseEvent) => {
      if (cloneRef.current && !cloneRef.current.contains(e.target as Node)) {
        setCloneOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cloneOpen]);

  const setContacts = (contacts: Contact[]) => update('contacts', contacts);

  const addContact = () => setContacts([...form.contacts, emptyContact()]);

  const cloneContact = (i: number) => {
    setContacts([...form.contacts, { ...form.contacts[i] }]);
    setCloneOpen(false);
  };

  const updateContact = (i: number, c: Contact) => {
    const updated = [...form.contacts];
    updated[i] = c;
    setContacts(updated);
  };

  const removeContact = (i: number) => {
    setContacts(form.contacts.filter((_, idx) => idx !== i));
  };

  const contactLabel = (c: Contact, i: number) =>
    c.organization || c.name || `Contact ${i + 1}`;

  return (
    <SectionWrapper id="contacts" title="Contacts" required>
      <p className="text-sm text-gray-500 mb-4">
        At least one contact is required. Add a contact with the <strong>host</strong> role for the best KPI score.
      </p>

      <div className="space-y-3 mb-4">
        {form.contacts.map((c, i) => (
          <ContactCard
            key={i}
            contact={c}
            index={i}
            onChange={updated => updateContact(i, updated)}
            onRemove={() => removeContact(i)}
            roles={contactRoles}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addContact}
          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex-1 justify-center"
        >
          <Plus size={16} /> Add contact
        </button>

        {form.contacts.length > 0 && (
          <div className="relative" ref={cloneRef}>
            <button
              type="button"
              onClick={() => setCloneOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors justify-center"
            >
              <Copy size={16} /> Clone existing contact
            </button>

            {cloneOpen && (
              <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48 py-1">
                {form.contacts.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => cloneContact(i)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {contactLabel(c, i)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
