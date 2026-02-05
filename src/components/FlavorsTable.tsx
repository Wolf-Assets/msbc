import { useState, useRef, useEffect } from 'react';

interface Flavor {
  id: number;
  name: string;
  unitPrice: number;
  unitCost: number | null;
  isActive: boolean;
}

interface FlavorsTableProps {
  initialFlavors: Flavor[];
}

export default function FlavorsTable({ initialFlavors }: FlavorsTableProps) {
  const [flavors, setFlavors] = useState<Flavor[]>(initialFlavors);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Reset pending delete after 3 seconds
  useEffect(() => {
    if (pendingDelete) {
      const timer = setTimeout(() => setPendingDelete(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [pendingDelete]);

  const updateFlavor = async (id: number, field: string, value: string) => {
    const numValue = field === 'name' ? value : parseFloat(value) || 0;

    // Optimistic update
    setFlavors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: numValue } : f))
    );

    try {
      const response = await fetch('/api/flavors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: numValue }),
      });

      if (!response.ok) throw new Error('Failed to update');
      showToast('Saved');
    } catch {
      showToast('Failed to save', 'error');
      // Revert on error
      setFlavors(initialFlavors);
    }
  };

  const addFlavor = async () => {
    try {
      const response = await fetch('/api/flavors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Flavor', unitPrice: 5, unitCost: null }),
      });

      if (!response.ok) throw new Error('Failed to add');

      const newFlavor = await response.json();
      setFlavors((prev) => [...prev, newFlavor]);
      showToast('Added new flavor');
    } catch {
      showToast('Failed to add flavor', 'error');
    }
  };

  const handleDeleteClick = async (id: number) => {
    // First click: show confirmation state
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }

    // Second click: actually delete
    try {
      const response = await fetch('/api/flavors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      setFlavors((prev) => prev.filter((f) => f.id !== id));
      setPendingDelete(null);
      showToast('Deleted');
    } catch {
      showToast('Failed to delete', 'error');
      setPendingDelete(null);
    }
  };

  return (
    <div>
      {/* Floating Card Container */}
      <div className="w-full bg-[#fafafc] rounded-3xl overflow-hidden">
        {/* Header inside card */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Flavors</h2>
            <p className="text-sm text-gray-400 mt-1">Click any cell to edit. Changes save automatically.</p>
          </div>
          <button
            onClick={addFlavor}
            className="px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium text-sm hover:bg-pink-600 transition-all hover:shadow-lg hover:shadow-pink-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Flavor
          </button>
        </div>

        {/* Table */}
        <div className="px-4 pb-4">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Flavor Name</th>
                <th className="w-28">Unit Price</th>
                <th className="w-28">Unit Cost</th>
                <th className="w-24">Margin</th>
                <th className="w-14"></th>
              </tr>
            </thead>
            <tbody>
              {flavors.map((flavor, index) => (
                <tr key={flavor.id} className="group">
                  <td className="text-center">
                    <span className="text-gray-400 text-sm">{index + 1}</span>
                  </td>
                  <td>
                    <EditableCell
                      value={flavor.name}
                      onSave={(value) => updateFlavor(flavor.id, 'name', value)}
                      isEditing={editingCell?.id === flavor.id && editingCell?.field === 'name'}
                      onEdit={() => setEditingCell({ id: flavor.id, field: 'name' })}
                      onBlur={() => setEditingCell(null)}
                    />
                  </td>
                  <td>
                    <EditableCell
                      value={`$${flavor.unitPrice.toFixed(2)}`}
                      onSave={(value) => updateFlavor(flavor.id, 'unitPrice', value.replace('$', ''))}
                      isEditing={editingCell?.id === flavor.id && editingCell?.field === 'unitPrice'}
                      onEdit={() => setEditingCell({ id: flavor.id, field: 'unitPrice' })}
                      onBlur={() => setEditingCell(null)}
                      type="currency"
                    />
                  </td>
                  <td>
                    <EditableCell
                      value={flavor.unitCost ? `$${flavor.unitCost.toFixed(2)}` : '—'}
                      onSave={(value) => updateFlavor(flavor.id, 'unitCost', value.replace('$', '').replace('—', ''))}
                      isEditing={editingCell?.id === flavor.id && editingCell?.field === 'unitCost'}
                      onEdit={() => setEditingCell({ id: flavor.id, field: 'unitCost' })}
                      onBlur={() => setEditingCell(null)}
                      type="currency"
                    />
                  </td>
                  <td>
                    <span className="editable-cell text-sm">
                      {flavor.unitCost
                        ? <span className="text-green-600 font-medium">
                            {(((flavor.unitPrice - flavor.unitCost) / flavor.unitPrice) * 100).toFixed(0)}%
                          </span>
                        : <span className="text-gray-300">—</span>
                      }
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteClick(flavor.id)}
                      className={`p-2 transition-all min-w-[44px] ${
                        pendingDelete === flavor.id
                          ? 'opacity-100 text-red-500 text-xs font-medium'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500'
                      }`}
                      title={pendingDelete === flavor.id ? 'Click again to confirm' : 'Delete'}
                    >
                      {pendingDelete === flavor.id ? (
                        <span className="animate-pulse">delete</span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {flavors.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No flavors yet. Click "Add Flavor" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onBlur: () => void;
  type?: 'text' | 'currency';
}

function EditableCell({ value, onSave, isEditing, onEdit, onBlur, type = 'text' }: EditableCellProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onBlur();
    }
  };

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    onBlur();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'currency' ? 'text' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="editable-cell w-full bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg"
      />
    );
  }

  return (
    <div
      onClick={onEdit}
      className="editable-cell cursor-text"
    >
      {value}
    </div>
  );
}
