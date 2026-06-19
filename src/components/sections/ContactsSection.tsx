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
    roles: [],
  };
}

const emailValid = (v: string) => !v || /^[a-zA-Z0-9_%+-]+(\.[a-zA-Z0-9_%+-]+)*@([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(v);

// Must start with +, then digits only (spaces/dashes/parens allowed for readability),
// with at least 7 digits total (country code + subscriber number).
const phoneValid = (v: string) => {
  if (!v) return true;
  if (!v.startsWith('+')) return false;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 7 && /^\+[\d\s\-().]+$/.test(v);
};

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

  const addr0 = contact.addresses?.[0] ?? {};
  const countryIncluded = 'country' in addr0;
  const cityIncluded = 'city' in addr0;

  const toggleAddressField = (field: 'country' | 'city', include: boolean) => {
    const next = { ...addr0 } as Record<string, unknown>;
    if (include) { next[field] = ''; } else { delete next[field]; }
    up('addresses', Object.keys(next).length > 0 ? [next] : undefined);
  };

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
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contact.emails !== undefined}
                  onChange={e => up('emails', e.target.checked ? [{ value: '', roles: ['pointOfContact'] }] : undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Email
              </label>
              {contact.emails !== undefined && (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={e => up('emails', [{ value: e.target.value, roles: ['pointOfContact'] }])}
                    placeholder="contact@example.org"
                    className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                      !emailValid(email)
                        ? 'border-red-400 bg-red-50 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {!emailValid(email) && (
                    <p className="text-xs text-red-600 mt-1">Enter a valid email address (e.g. user@example.org).</p>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contact.phones !== undefined}
                  onChange={e => up('phones', e.target.checked ? [{ value: '', roles: ['voice'] }] : undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Phone
              </label>
              {contact.phones !== undefined && (
                <>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => up('phones', [{ value: e.target.value, roles: ['voice'] }])}
                    placeholder="+44 1632 960000"
                    className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                      !phoneValid(phone)
                        ? 'border-red-400 bg-red-50 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {!phoneValid(phone) && (
                    <p className="text-xs text-red-600 mt-1">
                      {!phone.startsWith('+')
                        ? 'Must include an international dialling code (e.g. +44 1632 960000).'
                        : !/^\+[\d\s\-().]+$/.test(phone)
                          ? 'Phone number must contain only numbers.'
                          : 'Phone number is too short — include the full number after the country code.'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={countryIncluded}
                  onChange={e => toggleAddressField('country', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Country{' '}
                <span className="font-normal text-gray-400">(ISO 3166-1 alpha-3)</span>
              </label>
              {countryIncluded && (
                <CountryPicker
                  value={(addr0 as { country?: string }).country || ''}
                  onChange={val => up('addresses', [{ ...addr0, country: val }])}
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cityIncluded}
                  onChange={e => toggleAddressField('city', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                City
              </label>
              {cityIncluded && (
                <input
                  type="text"
                  value={(addr0 as { city?: string }).city || ''}
                  onChange={e => up('addresses', [{ ...addr0, city: e.target.value }])}
                  placeholder="City"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contact.identifier !== undefined}
                  onChange={e => up('identifier', e.target.checked ? '' : undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Identifier
              </label>
              {contact.identifier !== undefined && (
                <input
                  type="text"
                  value={contact.identifier}
                  onChange={e => up('identifier', e.target.value)}
                  placeholder="Unique identifier for this contact"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contact.position !== undefined}
                  onChange={e => up('position', e.target.checked ? '' : undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Position
              </label>
              {contact.position !== undefined && (
                <input
                  type="text"
                  value={contact.position}
                  onChange={e => up('position', e.target.value)}
                  placeholder="Role or position of the responsible person or team"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contact.hoursOfService !== undefined}
                  onChange={e => up('hoursOfService', e.target.checked ? '' : undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Hours of service
              </label>
              {contact.hoursOfService !== undefined && (
                <input
                  type="text"
                  value={contact.hoursOfService}
                  onChange={e => up('hoursOfService', e.target.value)}
                  placeholder="Time period when the contact can be contacted"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contact.contactInstructions !== undefined}
                  onChange={e => up('contactInstructions', e.target.checked ? '' : undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Contact instructions
              </label>
              {contact.contactInstructions !== undefined && (
                <textarea
                  value={contact.contactInstructions}
                  onChange={e => up('contactInstructions', e.target.value)}
                  rows={2}
                  placeholder="How to get in touch (e.g. email preferred, office hours)"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Roles</label>
            <div className="flex flex-wrap gap-1.5">
              {roles.map(role => {
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
