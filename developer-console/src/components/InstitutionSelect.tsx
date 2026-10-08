import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';

export interface InstitutionOption {
  id: string;
  institutionCode: string;
  institutionName: string;
  institutionType: string;
}

interface InstitutionSelectProps {
  value: string;
  onChange: (code: string, label: string) => void;
  allowAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const SEARCH_LIMIT = 50;

const optionStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  cursor: 'pointer',
  backgroundColor: isActive ? 'var(--color-background)' : 'transparent',
  borderBottom: '1px solid var(--color-border)',
});

const messageStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '12.5px',
  color: 'var(--color-text-muted)',
};

/**
 * Searchable institution picker (typeahead). Replaces a full <select> that
 * would render every institution — instead it queries the server for at most
 * SEARCH_LIMIT matches, debounced, as the user types.
 */
export const InstitutionSelect: React.FC<InstitutionSelectProps> = ({
  value,
  onChange,
  allowAll = false,
  allLabel = 'All institutions',
  placeholder = 'Search institutions...',
  required = false,
  disabled = false,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InstitutionOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const [selectedLabel, setSelectedLabel] = useState('');

  // Keep the display label in sync with the current value.
  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }
    let cancelled = false;
    developerApi
      .getInstitutions({ search: value, limit: SEARCH_LIMIT })
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        const match = data.find((i) => i.institutionCode.toUpperCase() === value.toUpperCase());
        setSelectedLabel(match ? match.institutionName : value);
      })
      .catch(() => {
        if (!cancelled) setSelectedLabel(value);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Debounced search while the dropdown is open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await developerApi.getInstitutions({
          search: query || undefined,
          limit: SEARCH_LIMIT,
        });
        setResults(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, open]);

  const openDropdown = () => {
    if (disabled) return;
    setQuery('');
    setActive(allowAll ? 0 : -1);
    setOpen(true);
  };

  const closeDropdown = () => {
    setOpen(false);
    setQuery('');
  };

  const select = (inst: InstitutionOption) => {
    setSelectedLabel(inst.institutionName);
    onChange(inst.institutionCode, inst.institutionName);
    closeDropdown();
  };

  const selectAll = () => {
    setSelectedLabel(allLabel);
    onChange('', allLabel);
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const optionCount = (allowAll ? 1 : 0) + results.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        openDropdown();
        return;
      }
      setActive((a) => Math.min(a + 1, optionCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return;
      setActive((a) => Math.max(a - 1, allowAll ? 0 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!open || active < 0) return;
      if (allowAll && active === 0) {
        selectAll();
      } else {
        const idx = allowAll ? active - 1 : active;
        const inst = results[idx];
        if (inst) select(inst);
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  };

  const display = !open
    ? value
      ? selectedLabel || value
      : allowAll
        ? allLabel
        : ''
    : query;

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        type="text"
        className="input"
        value={display}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={!open}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        onFocus={openDropdown}
        onBlur={() => setTimeout(closeDropdown, 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(allowAll ? 0 : -1);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 40,
            marginTop: '4px',
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {allowAll && (
            <div onMouseDown={() => selectAll()} style={optionStyle(active === 0)}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{allLabel}</span>
            </div>
          )}

          {busy && results.length === 0 ? (
            <div style={messageStyle}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={messageStyle}>
              {query ? `No institutions match "${query}"` : 'No institutions found yet'}
            </div>
          ) : (
            results.map((inst, i) => {
              const idx = allowAll ? i + 1 : i;
              return (
                <div key={inst.id} onMouseDown={() => select(inst)} style={optionStyle(active === idx)}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {inst.institutionName}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                    {inst.institutionCode} · {inst.institutionType}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
