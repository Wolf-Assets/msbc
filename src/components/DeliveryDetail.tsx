import { useState, useRef, useEffect, useCallback, ComponentType } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/style.css';

interface QuillEditorProps {
  theme: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  modules: QuillModules;
  formats: string[];
  placeholder: string;
}

interface QuillModules {
  toolbar: string[][];
}

type QuillComponentType = ComponentType<QuillEditorProps>;

interface Delivery {
  id: number;
  storeName: string;
  datePrepared: string;
  dropoffDate: string | null;
  expirationDate: string | null;
  totalPrepared: number;
  totalCogs: number;
  totalRevenue: number;
  grossProfit: number;
  profitMargin: number;
  notes: string | null;
  invoiceNotes: string | null;
  additionalFees: number;
  discount: number;
  prepaidAmount: number;
  cashCollected: number;
  venmoCollected: number;
  otherCollected: number;
}

interface DeliveryItem {
  id: number;
  deliveryId: number;
  flavorName: string;
  prepared: number;
  unitPrice: number | null;
  unitCost: number | null;
  revenue: number;
  cogs: number;
  profit: number;
  rateId: number | null;
}

interface Flavor {
  id: number;
  name: string;
  unitPrice: number;
  unitCost: number | null;
  isActive: boolean;
}

interface FlavorPrice {
  id: number;
  flavorId: number;
  tierName: string;
  price: number;
  cost: number | null;
}

interface RenderViaCanvasOpts {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  maxWidth?: number;
}

interface NewItemData {
  prepared: number;
  unitCost: string;
}

type DeliveryField = keyof Delivery;

type DeliveryItemField = 'prepared' | 'unitPrice' | 'unitCost' | 'rateId';

interface DeliveryDetailProps {
  deliveryId: number;
}

export default function DeliveryDetail({ deliveryId }: DeliveryDetailProps) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [availableFlavors, setAvailableFlavors] = useState<Flavor[]>([]);
  const [flavorPrices, setFlavorPrices] = useState<FlavorPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    if (!deliveryId) return;

    Promise.all([
      fetch(`/api/deliveries?id=${deliveryId}`).then((res: Response) => res.json() as Promise<Delivery>),
      fetch(`/api/delivery-items?deliveryId=${deliveryId}`).then((res: Response) => res.json() as Promise<DeliveryItem[]>),
      fetch('/api/flavors').then((res: Response) => res.json() as Promise<Flavor[]>),
      fetch('/api/flavor-prices').then((res: Response) => res.json() as Promise<FlavorPrice[]>),
    ])
      .then(([deliveryData, itemsData, flavorsData, pricesData]: [Delivery, DeliveryItem[], Flavor[], FlavorPrice[]]) => {
        setDelivery(deliveryData);
        setItems(itemsData || []);
        setAvailableFlavors(flavorsData);
        setFlavorPrices(pricesData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [deliveryId]);

  const [editingDatePrepared, setEditingDatePrepared] = useState(false);
  const [editingDropoffDate, setEditingDropoffDate] = useState(false);
  const [showAddFlavor, setShowAddFlavor] = useState(false);
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | ''>('');
  const [selectedRateId, setSelectedRateId] = useState<number | ''>('');
  const [newItemData, setNewItemData] = useState<NewItemData>({
    prepared: 0,
    unitCost: '',
  });
  const [pendingDeleteDelivery, setPendingDeleteDelivery] = useState(false);

  // Sorting state
  type SortColumn = 'id' | 'flavorName' | 'prepared' | 'revenue' | 'unitCost' | 'cogs' | 'profit';
  const [sortColumn, setSortColumn] = useState<SortColumn>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Reset pending delete after 3 seconds
  useEffect(() => {
    if (pendingDeleteDelivery) {
      const timer = setTimeout(() => setPendingDeleteDelivery(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pendingDeleteDelivery]);

  const [hardDelete, setHardDelete] = useState(false);

  const handleDeleteDelivery = async (e?: React.MouseEvent) => {
    const isShift = e?.shiftKey || false;

    // First click: show confirmation state
    if (!pendingDeleteDelivery) {
      setPendingDeleteDelivery(true);
      if (isShift) setHardDelete(true);
      return;
    }

    // Second click: actually delete
    if (!delivery) return;
    try {
      const response = await fetch('/api/deliveries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: delivery.id, hard: hardDelete }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      // Redirect to deliveries page
      window.location.href = '/deliveries';
    } catch {
      showToast('Failed to delete delivery', 'error');
      setPendingDeleteDelivery(false);
      setHardDelete(false);
    }
  };

  // Get flavor ID for an item
  const getFlavorId = (flavorName: string): number => {
    const matchingFlavor = availableFlavors.find(f => f.name === flavorName);
    return matchingFlavor ? matchingFlavor.id : 9999;
  };

  // Sorting function
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    if (sortColumn === 'id') {
      aVal = getFlavorId(a.flavorName);
      bVal = getFlavorId(b.flavorName);
    } else if (sortColumn === 'flavorName') {
      aVal = a.flavorName.toLowerCase();
      bVal = b.flavorName.toLowerCase();
    } else {
      aVal = a[sortColumn] ?? 0;
      bVal = b[sortColumn] ?? 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const resetAddFlavorForm = () => {
    setSelectedFlavorId('');
    setSelectedRateId('');
    setNewItemData({ prepared: 0, unitCost: '' });
  };

  const handleAddFlavor = async () => {
    if (!selectedFlavorId) {
      showToast('Please select a flavor', 'error');
      return;
    }

    const selectedFlavor = availableFlavors.find(f => f.id === selectedFlavorId);
    if (!selectedFlavor) {
      showToast('Flavor not found', 'error');
      return;
    }

    if (!selectedRateId) {
      showToast('Please select a rate', 'error');
      return;
    }

    const selectedRate = flavorPrices.find(p => p.id === selectedRateId);
    if (!selectedRate) {
      showToast('Rate not found', 'error');
      return;
    }

    const flavorName = selectedFlavor.name;
    const unitPrice = selectedRate.price;
    const unitCost = selectedRate.cost ?? 0;

    if (!delivery) return;

    const qty = newItemData.prepared || 0;

    try {
      const response = await fetch('/api/delivery-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId: delivery.id,
          flavorName,
          prepared: qty,
          unitPrice,
          unitCost,
          rateId: selectedRate.id,
          revenue: qty * unitPrice,
          cogs: qty * unitCost,
          profit: qty * (unitPrice - unitCost),
        }),
      });

      if (!response.ok) throw new Error('Failed to add');

      const newItem: DeliveryItem = await response.json() as DeliveryItem;
      setItems(prev => [...prev, newItem]);
      setShowAddFlavor(false);
      resetAddFlavorForm();
      showToast('Flavor added');

      // Refresh delivery totals
      const deliveryResponse = await fetch(`/api/deliveries?id=${delivery.id}`);
      if (deliveryResponse.ok) {
        const updatedDelivery: Delivery = await deliveryResponse.json() as Delivery;
        setDelivery(updatedDelivery);
      }
    } catch {
      showToast('Failed to add flavor', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'MMM d');
  };

  const updateDatePrepared = async (newDate: Date | null) => {
    if (!newDate || !delivery) return;

    const dateStr = newDate.toISOString().split('T')[0];

    // Optimistic update
    setDelivery((prev) => prev ? { ...prev, datePrepared: dateStr } : null);
    setEditingDatePrepared(false);

    try {
      const response = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: delivery.id, datePrepared: dateStr }),
      });

      if (!response.ok) throw new Error('Failed to update');
      showToast('Date updated');
    } catch {
      showToast('Failed to update date', 'error');
      fetch(`/api/deliveries?id=${deliveryId}`).then((res: Response) => res.json() as Promise<Delivery>).then(setDelivery);
    }
  };

  const updateDropoffDate = async (newDate: Date | null) => {
    if (!delivery) return;

    const dateStr = newDate ? newDate.toISOString().split('T')[0] : null;

    // Optimistic update
    setDelivery((prev) => prev ? { ...prev, dropoffDate: dateStr } : null);
    setEditingDropoffDate(false);

    try {
      const response = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: delivery.id, dropoffDate: dateStr }),
      });

      if (!response.ok) throw new Error('Failed to update');
      showToast('Dropoff date updated');
    } catch {
      showToast('Failed to update dropoff date', 'error');
      fetch(`/api/deliveries?id=${deliveryId}`).then((res: Response) => res.json() as Promise<Delivery>).then(setDelivery);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const updateDelivery = async (field: DeliveryField, value: string | number | null) => {
    if (!delivery) return;
    // Optimistic update
    setDelivery((prev) => prev ? { ...prev, [field]: value } : null);

    try {
      const response = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: delivery.id, [field]: value }),
      });

      if (!response.ok) throw new Error('Failed to update');
      showToast('Saved');
    } catch {
      showToast('Failed to save', 'error');
      fetch(`/api/deliveries?id=${deliveryId}`).then((res: Response) => res.json() as Promise<Delivery>).then(setDelivery);
    }
  };

  const updateItem = async (itemId: number, field: DeliveryItemField, value: number | null) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !delivery) return;

    // Calculate derived values
    let updates: Partial<DeliveryItem> = { [field]: value };

    const prepared = field === 'prepared' ? (value as number) : item.prepared;
    const unitCost = field === 'unitCost' ? (value as number | null) : item.unitCost;

    // Calculate revenue = prepared * unitPrice
    const flavor = availableFlavors.find(f => f.name === item.flavorName);
    const unitPrice = item.unitPrice || flavor?.unitPrice || 5;
    const revenue = prepared * unitPrice;
    updates.revenue = revenue;

    // Calculate COGS = prepared * unitCost
    const cogs = unitCost ? prepared * unitCost : 0;
    updates.cogs = cogs;

    // Calculate profit = revenue - cogs
    updates.profit = revenue - cogs;

    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));

    try {
      const response = await fetch('/api/delivery-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, deliveryId: delivery.id, ...updates }),
      });

      if (!response.ok) throw new Error('Failed to update');

      // Refresh delivery totals
      const deliveryResponse = await fetch(`/api/deliveries?id=${delivery.id}`);
      if (deliveryResponse.ok) {
        const updatedDelivery: Delivery = await deliveryResponse.json() as Delivery;
        setDelivery(updatedDelivery);
      }
    } catch {
      showToast('Failed to save', 'error');
      fetch(`/api/delivery-items?deliveryId=${deliveryId}`).then((res: Response) => res.json() as Promise<DeliveryItem[]>).then(setItems);
    }
  };

  const getRatesForFlavor = (flavorName: string): FlavorPrice[] => {
    const flavor = availableFlavors.find(f => f.name === flavorName);
    if (!flavor) return [];
    return flavorPrices.filter(p => p.flavorId === flavor.id);
  };

  const getMatchingRate = (item: DeliveryItem): string => {
    if (item.rateId) {
      const match = flavorPrices.find(p => p.id === item.rateId);
      if (match) return match.tierName;
    }
    // Fallback: match by price + cost
    const rates = getRatesForFlavor(item.flavorName);
    const match = rates.find(r => r.price === item.unitPrice && r.cost === item.unitCost);
    return match ? match.tierName : 'Custom';
  };

  const deleteItem = async (itemId: number) => {
    if (!delivery) return;
    // Optimistic update
    setItems(prev => prev.filter(i => i.id !== itemId));

    try {
      const response = await fetch('/api/delivery-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, deliveryId: delivery.id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      showToast('Item deleted');

      // Refresh delivery totals
      const deliveryResponse = await fetch(`/api/deliveries?id=${delivery.id}`);
      if (deliveryResponse.ok) {
        const updatedDelivery: Delivery = await deliveryResponse.json() as Delivery;
        setDelivery(updatedDelivery);
      }
    } catch {
      showToast('Failed to delete', 'error');
      fetch(`/api/delivery-items?deliveryId=${deliveryId}`).then((res: Response) => res.json() as Promise<DeliveryItem[]>).then(setItems);
    }
  };


  const getExpirationStatus = (expirationDate: string | null): { color: string; bgColor: string } => {
    if (!expirationDate) return { color: 'text-gray-500', bgColor: 'bg-gray-100' };

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate + 'T00:00:00');
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-700', bgColor: 'bg-red-100' };
    if (diffDays <= 2) return { color: 'text-orange-700', bgColor: 'bg-orange-100' };
    return { color: 'text-green-700', bgColor: 'bg-green-100' };
  };

  const handleDownloadInvoice = async () => {
    if (!delivery) return;

    try {
      const [{ jsPDF }, { bricolageGrotesqueRegular, bricolageGrotesqueBold, mightySweetsLogo }] = await Promise.all([
        import('jspdf'),
        import('@/fonts/bricolage-grotesque'),
      ]);
      const doc = new jsPDF();

      // Register Bricolage Grotesque font
      doc.addFileToVFS('BricolageGrotesque-Regular.ttf', bricolageGrotesqueRegular);
      doc.addFont('BricolageGrotesque-Regular.ttf', 'BricolageGrotesque', 'normal');
      doc.addFileToVFS('BricolageGrotesque-Bold.ttf', bricolageGrotesqueBold);
      doc.addFont('BricolageGrotesque-Bold.ttf', 'BricolageGrotesque', 'bold');

      // Use the custom font
      doc.setFont('BricolageGrotesque', 'bold');

      // Header — Left: "Invoice" + meta, Right: Logo only
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      doc.text('Invoice', 14, 20);

      // Logo on the right (original aspect ratio: 116x100)
      const logoW = 16;
      const logoH = logoW * (100 / 116);
      doc.addImage(mightySweetsLogo, 'PNG', 196 - logoW, 10, logoW, logoH);

      // Invoice meta lines — label : value aligned
      const shortDate = (d: string): string => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      };
      doc.setFontSize(10);
      doc.setFont('BricolageGrotesque', 'normal');
      doc.setTextColor(30, 30, 30);
      const metaLabelX = 14;
      const metaValX = 44;
      const metaValX2 = 50;
      doc.setFont('BricolageGrotesque', 'bold');
      doc.text('Invoice number', metaLabelX, 35);
      doc.text(`${delivery.id}`, metaValX2, 35);
      doc.setFont('BricolageGrotesque', 'normal');
      doc.text('Date of issue', metaLabelX, 40);
      doc.text(shortDate(delivery.datePrepared), metaValX2, 40);
      doc.text('Date due', metaLabelX, 45);
      doc.text(delivery.dropoffDate ? shortDate(delivery.dropoffDate) : '—', metaValX2, 45);

      // Company name in bold after a line break
      doc.setFont('BricolageGrotesque', 'bold');
      doc.text('Mighty Sweet Baking Co.', 14, 55);
      doc.setFont('BricolageGrotesque', 'normal');
      doc.text('Niskayuna, NY 12309', 14, 60);
      doc.text('United States', 14, 65);
      doc.text('hello@mightysweetbakingco.com', 14, 70);

      // Bill to section — right side
      const billToX = 90;
      doc.setFont('BricolageGrotesque', 'bold');
      doc.text('Bill to', billToX, 55);
      doc.setFont('BricolageGrotesque', 'normal');
      doc.text(delivery.storeName, billToX, 60);
      doc.text('United States', billToX, 65);

      // Calculate invoice totals
      const subtotal = delivery.totalRevenue;
      const fees = delivery.additionalFees || 0;
      const disc = delivery.discount || 0;
      const invoiceTotal = subtotal + fees - disc;
      const amountDue = invoiceTotal - (delivery.prepaidAmount || 0);

      // Amount due — bold, single line
      doc.setFontSize(15);
      doc.setFont('BricolageGrotesque', 'bold');
      doc.setTextColor(30, 30, 30);
      const dueDateStr = delivery.dropoffDate ? shortDate(delivery.dropoffDate) : '—';
      doc.text(`${formatCurrency(amountDue)} USD due ${dueDateStr}`, 14, 85);

      // Items table header — bold, same size as body/email text
      const tableStartY = 100;
      doc.setFontSize(10);
      doc.setFont('BricolageGrotesque', 'bold');
      doc.setTextColor(30, 30, 30);

      const cols = ['Description', 'Qty', 'Unit price', 'Amount'];
      const colX = [14, 150, 173, 196];

      // Right-align numeric columns
      doc.text(cols[0], colX[0], tableStartY);
      doc.text(cols[1], colX[1], tableStartY, { align: 'right' });
      doc.text(cols[2], colX[2], tableStartY, { align: 'right' });
      doc.text(cols[3], colX[3], tableStartY, { align: 'right' });

      // Thin separator line under header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(14, tableStartY + 3, 196, tableStartY + 3);

      // Items
      doc.setTextColor(60);
      const rowHeight = 7;
      let y = tableStartY + 9;

      items.forEach((item, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        // Alternating row background (only if 3+ items)
        if (items.length >= 3 && idx % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, y - 4.5, 182, rowHeight, 'F');
        }

        doc.setFont('BricolageGrotesque', 'normal');
        doc.setTextColor(60);
        doc.text(item.flavorName, colX[0], y);
        doc.text(item.prepared.toString(), colX[1], y, { align: 'right' });
        doc.text(item.unitPrice ? formatCurrency(item.unitPrice) : '—', colX[2], y, { align: 'right' });
        doc.text(formatCurrency(item.revenue), colX[3], y, { align: 'right' });
        y += rowHeight;
      });

      // Thin separator before subtotal
      y += 3;
      doc.line(14, y - 5, 196, y - 5);

      // Subtotal
      doc.setFont('BricolageGrotesque', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text('Subtotal', colX[0], y);
      doc.text(formatCurrency(subtotal), colX[3], y, { align: 'right' });

      // Additional fees (if any)
      if (fees > 0) {
        y += rowHeight;
        doc.text('Additional fees', colX[0], y);
        doc.text(formatCurrency(fees), colX[3], y, { align: 'right' });
      }

      // Discount (if any)
      if (disc > 0) {
        y += rowHeight;
        doc.text('Discount', colX[0], y);
        doc.text(`-${formatCurrency(disc)}`, colX[3], y, { align: 'right' });
      }

      // Total
      y += rowHeight;
      doc.text('Total', colX[0], y);
      doc.text(formatCurrency(invoiceTotal), colX[3], y, { align: 'right' });

      // Prepaid (if any)
      if ((delivery.prepaidAmount || 0) > 0) {
        y += rowHeight;
        doc.setFont('BricolageGrotesque', 'normal');
        doc.text('Prepaid', colX[0], y);
        doc.text(`-${formatCurrency(delivery.prepaidAmount)}`, colX[3], y, { align: 'right' });
      }

      // Amount due
      y += rowHeight;
      doc.line(14, y - 5, 196, y - 5);
      doc.setFont('BricolageGrotesque', 'bold');
      doc.text('Amount due', colX[0], y);
      doc.text(formatCurrency(amountDue), colX[3], y, { align: 'right' });

      // Instructions section header
      y += 14;
      doc.setFontSize(11);
      doc.setFont('BricolageGrotesque', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Instructions', 14, y);
      const instrW = doc.getTextWidth('Instructions');
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.4);
      doc.line(14, y + 1.2, 14 + instrW, y + 1.2);
      y += 7;

      // Line 1: Prepared on [date]
      doc.setFont('BricolageGrotesque', 'normal');
      doc.setTextColor(60);
      const prepDate = new Date(delivery.datePrepared + 'T00:00:00');
      const prepDay = prepDate.toLocaleDateString('en-US', { weekday: 'long' });
      const prepFull = shortDate(delivery.datePrepared);
      const prepText = 'Prepared on ';
      const prepDateText = `${prepDay}, ${prepFull}`;
      doc.text(prepText, 14, y);
      const prepTextW = doc.getTextWidth(prepText);
      doc.setTextColor(236, 72, 153); // pink
      doc.setFont('BricolageGrotesque', 'bold');
      doc.text(prepDateText, 14 + prepTextW, y);

      // Line 2: Best before [date]
      if (delivery.expirationDate) {
        y += 6;
        doc.setFont('BricolageGrotesque', 'normal');
        doc.setTextColor(60);
        const expDate = new Date(delivery.expirationDate + 'T00:00:00');
        const expDay = expDate.toLocaleDateString('en-US', { weekday: 'long' });
        const expFull = shortDate(delivery.expirationDate);
        const expText = 'Best before ';
        const expDateText = `${expDay}, ${expFull}`;
        doc.text(expText, 14, y);
        const expTextW = doc.getTextWidth(expText);
        doc.setTextColor(236, 72, 153); // pink
        doc.setFont('BricolageGrotesque', 'bold');
        doc.text(expDateText, 14 + expTextW, y);
      }

      // Invoice notes section (if any)
      if (delivery.invoiceNotes && delivery.invoiceNotes.trim() && delivery.invoiceNotes !== '<p><br></p>') {
        y += 14;
        doc.setFontSize(11);
        doc.setFont('BricolageGrotesque', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Additional notes', 14, y);
        const notesW = doc.getTextWidth('Additional notes');
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(0.4);
        doc.line(14, y + 1.2, 14 + notesW, y + 1.2);
        y += 7;

        // Parse HTML from Quill and render with bold/italic/underline support
        doc.setTextColor(60);
        const noteHtml = delivery.invoiceNotes;
        const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;

        // Helper: render text via canvas (for italic — browser synthesizes italic from regular font)
        const renderViaCanvas = (text: string, x: number, yPos: number, opts: RenderViaCanvasOpts): { width: number; height: number } => {
          const dpr = 4;
          const ptSize = 11 * (96 / 72); // convert PDF points to CSS px equivalent
          const pxSize = ptSize * dpr;
          const weight = opts.bold ? 'bold' : 'normal';
          const style = opts.italic ? 'italic' : 'normal';
          const cvs = document.createElement('canvas');
          const ctx = cvs.getContext('2d')!;
          ctx.font = `${style} ${weight} ${pxSize}px 'Bricolage Grotesque', sans-serif`;
          const measured = ctx.measureText(text);
          const w = Math.ceil(measured.width) + pxSize;
          const h = Math.ceil(pxSize * 1.4);
          cvs.width = w;
          cvs.height = h;
          ctx.font = `${style} ${weight} ${pxSize}px 'Bricolage Grotesque', sans-serif`;
          ctx.fillStyle = 'rgb(60,60,60)';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(text, 0, pxSize * 1.05);
          if (opts.underline) {
            ctx.strokeStyle = 'rgb(60,60,60)';
            ctx.lineWidth = pxSize * 0.06;
            const underY = pxSize * 1.15;
            ctx.beginPath();
            ctx.moveTo(0, underY);
            ctx.lineTo(measured.width, underY);
            ctx.stroke();
          }
          const dataUrl = cvs.toDataURL('image/png');
          const mmPerPx = 25.4 / (96 * dpr);
          const imgW = Math.min(w * mmPerPx, opts.maxWidth || 182);
          const imgH = h * mmPerPx;
          doc.addImage(dataUrl, 'PNG', x, yPos - imgH * 0.75, imgW, imgH);
          return { width: measured.width * mmPerPx, height: imgH };
        };

        // Helper: render a text segment with full formatting
        const renderText = (text: string, x: number, yPos: number, bold: boolean, italic: boolean, underline: boolean, maxW: number): void => {
          if (italic) {
            const { width } = renderViaCanvas(text, x, yPos, { bold, italic: true, underline, maxWidth: maxW });
            const lines = doc.splitTextToSize(text, maxW);
            y += lines.length * 5;
          } else {
            doc.setFont('BricolageGrotesque', bold ? 'bold' : 'normal');
            doc.text(text, x, yPos, { maxWidth: maxW });
            if (underline) {
              const tw = doc.getTextWidth(text);
              doc.setDrawColor(60);
              doc.setLineWidth(0.3);
              doc.line(x, yPos + 1, x + tw, yPos + 1);
            }
            const lines = doc.splitTextToSize(text, maxW);
            y += lines.length * 5;
          }
        };

        if (tempDiv) {
          tempDiv.innerHTML = noteHtml;
          const processNode = (node: Node): void => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent || '';
              if (text.trim()) {
                doc.setFont('BricolageGrotesque', 'normal');
                doc.text(text, 14, y, { maxWidth: 182 });
                const lines = doc.splitTextToSize(text, 182);
                y += lines.length * 5;
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const tag = el.tagName.toLowerCase();

              // Check current tag, ancestors (closest), AND descendants (querySelector)
              const isBold = !!(tag === 'strong' || tag === 'b' || el.closest('strong, b') || el.querySelector('strong, b'));
              const isItalic = !!(tag === 'em' || tag === 'i' || el.closest('em, i') || el.querySelector('em, i'));
              const isUnderline = !!(tag === 'u' || el.closest('u') || el.querySelector('u'));

              if (tag === 'br') { y += 4; return; }

              if (el.children.length === 0) {
                // Leaf node — render with all accumulated formatting
                const text = el.textContent || '';
                if (text.trim()) renderText(text, 14, y, isBold, isItalic, isUnderline, 182);
              } else {
                // Has nested elements — recurse so inner tags (em, u, strong) get detected via el.closest()
                el.childNodes.forEach(child => processNode(child));
              }

              if (tag === 'p') y += 2;
            }
          };
          tempDiv.childNodes.forEach(child => processNode(child));
        }
      }

      // Made with ❤️ by Mighty Sweet Baking Co. — near footer, centered
      const pageHeight = doc.internal.pageSize.height;
      y = Math.max(y + 20, pageHeight - 18);
      doc.setFontSize(11);
      const pageW = doc.internal.pageSize.width;
      const heartSize = 4; // mm

      // Render actual Apple ❤️ emoji on canvas → PNG
      const heartCanvas = document.createElement('canvas');
      heartCanvas.width = 128;
      heartCanvas.height = 128;
      const hctx = heartCanvas.getContext('2d')!;
      hctx.clearRect(0, 0, 128, 128);
      hctx.font = '110px "Apple Color Emoji"';
      hctx.textBaseline = 'top';
      hctx.fillText('❤️', 8, 8);
      const heartDataUrl = heartCanvas.toDataURL('image/png');

      // All text same style, measure for centering
      doc.setFont('BricolageGrotesque', 'normal');
      doc.setTextColor(100);
      const seg1 = 'Made with ';
      const seg2 = ' by ';
      const seg3 = 'Mighty Sweet Baking Co.';
      const seg1W = doc.getTextWidth(seg1);
      const seg2W = doc.getTextWidth(seg2);
      const seg3W = doc.getTextWidth(seg3);
      const totalW = seg1W + heartSize + seg2W + seg3W;
      let loveX = (pageW - totalW) / 2;

      // "Made with "
      doc.text(seg1, loveX, y);
      loveX += seg1W;

      // ❤️
      doc.addImage(heartDataUrl, 'PNG', loveX, y - 2.8, heartSize, heartSize);
      loveX += heartSize;

      // " by "
      doc.text(seg2, loveX, y);
      loveX += seg2W;

      // "Mighty Sweet Baking Co." — pink underlined
      doc.setTextColor(236, 72, 153);
      doc.text(seg3, loveX, y);
      doc.setDrawColor(236, 72, 153);
      doc.setLineWidth(0.3);
      doc.line(loveX, y + 1, loveX + seg3W, y + 1);

      // Open in new tab, with proper filename for save-as
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `invoice_${delivery.id}.pdf`, { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfFile);
      window.open(pdfUrl, '_blank');
      showToast('Invoice opened');
    } catch {
      showToast('Failed to generate invoice', 'error');
    }
  };

  // Loading state
  if (loading || !delivery) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculated metrics
  const grossMargin = delivery.totalRevenue > 0
    ? ((delivery.grossProfit / delivery.totalRevenue) * 100).toFixed(1)
    : '0';

  const expirationStatus = getExpirationStatus(delivery.expirationDate);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <a
        href="/deliveries"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Deliveries
      </a>

      {/* 80/20 Layout */}
      <div className="flex gap-6">
        {/* Left side - 80% */}
        <div className="flex-[4]">
          {/* Delivery Header Card */}
          <div
            className="bg-white rounded-3xl overflow-hidden"
            style={{
              boxShadow: '0 8px 60px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
        <div className="px-8 pt-8 pb-6">
            <EditableText
              value={delivery.storeName}
              onSave={(value) => updateDelivery('storeName', value)}
              className="text-3xl font-bold text-gray-900"
            />
        </div>

        {/* Stats Grid - Calculated Metrics */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Cookies"
              value={delivery.totalPrepared.toString()}
              sublabel={`${items.length} flavors`}
              highlight
            />
            <StatCard
              label="Gross Margin"
              value={`${grossMargin}%`}
              sublabel={`${formatCurrency(delivery.grossProfit)} profit`}
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(delivery.totalRevenue)}
              sublabel="from deliveries"
            />
            <StatCard
              label="Gross Profit"
              value={formatCurrency(delivery.grossProfit)}
              sublabel={`${formatCurrency(delivery.totalCogs)} COGS`}
            />
          </div>
        </div>

        {/* Details Section - inside same card */}
        <div className="px-8 pb-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">Details</h3>
            <button
              onClick={() => setShowAddFlavor(true)}
              className="px-3 py-1.5 text-pink-600 hover:bg-pink-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Flavor
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No flavors added to this delivery yet.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Flavor</th>
                  <th style={{ width: '100%' }}></th>
                  <th className="text-center">Rate</th>
                  <SortableHeader column="prepared" label="Qty" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="text-right" />
                  <SortableHeader column="cogs" label="COGS" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="text-right" />
                  <SortableHeader column="revenue" label="Revenue" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="text-right" />
                  <SortableHeader column="profit" label="Profit" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="text-right" />
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td>
                      <span className="editable-cell font-medium text-gray-900 whitespace-nowrap">
                        {item.flavorName}
                      </span>
                    </td>
                    <td></td>
                    <td className="pl-2">
                      <div className="flex justify-start">
                        <select
                          value={getMatchingRate(item)}
                          onChange={(e) => {
                            const rateName = e.target.value;
                            const rates = getRatesForFlavor(item.flavorName);
                            const rate = rates.find(r => r.tierName === rateName);
                            if (rate) {
                              const newRevenue = item.prepared * rate.price;
                              const newCogs = item.prepared * (rate.cost ?? 0);
                              const allUpdates = {
                                unitPrice: rate.price,
                                unitCost: rate.cost ?? 0,
                                rateId: rate.id,
                                revenue: newRevenue,
                                cogs: newCogs,
                                profit: newRevenue - newCogs,
                              };
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...allUpdates } : i));
                              fetch('/api/delivery-items', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: item.id, deliveryId: delivery?.id, ...allUpdates }),
                              }).then(async () => {
                                if (delivery) {
                                  const res = await fetch(`/api/deliveries?id=${delivery.id}`);
                                  if (res.ok) setDelivery(await res.json() as Delivery);
                                }
                              });
                            }
                          }}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 cursor-pointer"
                        >
                          {getRatesForFlavor(item.flavorName).map(rate => (
                            <option key={rate.id} value={rate.tierName}>
                              {rate.tierName} — ${rate.price.toFixed(2)}{rate.cost != null ? ` / $${rate.cost.toFixed(2)} cost` : ''}
                            </option>
                          ))}
                          {getMatchingRate(item) === 'Custom' && <option value="Custom">Custom</option>}
                        </select>
                      </div>
                    </td>
                    <td>
                      <EditableNumber
                        value={item.prepared}
                        onSave={(val) => updateItem(item.id, 'prepared', val)}
                        className="editable-cell text-gray-600 text-sm text-right justify-end"
                        showPencil
                      />
                    </td>
                    <td>
                      <span className="editable-cell text-sm text-right justify-end text-gray-600">
                        {item.cogs > 0 ? formatCurrency(item.cogs) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="editable-cell text-gray-600 text-sm text-right justify-end">
                        {item.revenue > 0 ? formatCurrency(item.revenue) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="editable-cell text-sm text-right justify-end">
                        {item.profit > 0 ? (
                          <span className="text-green-600 font-medium">{formatCurrency(item.profit)}</span>
                        ) : item.profit < 0 ? (
                          <span className="text-red-500 font-medium">{formatCurrency(item.profit)}</span>
                        ) : (
                          '—'
                        )}
                      </span>
                    </td>
                    <td>
                      <HoldDeleteButton onDelete={() => deleteItem(item.id)} />
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                  <td>
                    <span className="editable-cell font-bold text-gray-900">Total</span>
                  </td>
                  <td></td>
                  <td></td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-right justify-end font-semibold">
                      {items.reduce((sum, i) => sum + i.prepared, 0)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end font-semibold text-gray-900">
                      {formatCurrency(items.reduce((sum, i) => sum + i.cogs, 0))}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end font-semibold text-gray-900">
                      {formatCurrency(items.reduce((sum, i) => sum + i.revenue, 0))}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end">
                      {(() => {
                        const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);
                        return totalProfit >= 0 ? (
                          <span className="text-green-600 font-bold">{formatCurrency(totalProfit)}</span>
                        ) : (
                          <span className="text-red-500 font-bold">{formatCurrency(totalProfit)}</span>
                        );
                      })()}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Notes Section — 50/50 */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Notes</h3>
              <NotesEditor
                content={delivery.notes || ''}
                onSave={(content) => updateDelivery('notes', content)}
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Invoice Notes</h3>
              <NotesEditor
                content={delivery.invoiceNotes || ''}
                onSave={(content) => updateDelivery('invoiceNotes', content)}
              />
            </div>
          </div>

          {/* Delete Delivery */}
          <div className="mt-8 mb-4">
            <button
              onClick={(e) => handleDeleteDelivery(e)}
              className="text-red-500 text-sm hover:text-red-600 transition-colors"
            >
              {pendingDeleteDelivery ? (
                <span className="animate-pulse">{hardDelete ? 'Confirm? Tap Again to PERMANENTLY DELETE' : 'Confirm? Tap Again to Archive'}</span>
              ) : (
                'Archive This Delivery'
              )}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Right side - 20% Sidebar */}
      <div className="flex-1 space-y-4">
        {/* Delivery Info Card */}
        <div
          className="bg-white rounded-2xl"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Delivery Info</h3>
          </div>
          <div className="p-4 space-y-3">
            {/* Date Prepared */}
            <div className="flex items-center justify-between ">
              <span className="text-sm font-medium text-gray-500">Prepared</span>
              <div className="relative">
                <button
                  onClick={() => setEditingDatePrepared(!editingDatePrepared)}
                  className="text-sm font-semibold text-gray-900 hover:text-pink-600 hover:bg-gray-50 px-2 -mr-2 rounded transition-colors group/prep flex items-center gap-1.5"
                >
                  {format(new Date(delivery.datePrepared + 'T00:00:00'), 'MMM d, yyyy')}
                  <svg className="text-gray-300 group-hover/prep:text-gray-400 shrink-0 transition-colors" style={{ width: '1em', height: '1em' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {editingDatePrepared && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setEditingDatePrepared(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
                      <DayPicker
                        mode="single"
                        selected={new Date(delivery.datePrepared + 'T00:00:00')}
                        defaultMonth={new Date(delivery.datePrepared + 'T00:00:00')}
                        onSelect={(date) => date && updateDatePrepared(date)}
                        className="!font-sans"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dropoff Date */}
            <div className="flex items-center justify-between ">
              <span className="text-sm font-medium text-gray-500">Dropoff</span>
              <div className="relative flex items-center gap-1">
                {delivery.dropoffDate && (() => {
                  const dropoff = new Date(delivery.dropoffDate + 'T00:00:00');
                  const prepared = new Date(delivery.datePrepared + 'T00:00:00');
                  const expiration = delivery.expirationDate ? new Date(delivery.expirationDate + 'T00:00:00') : null;
                  const beforePrepared = dropoff < prepared;
                  const afterExpiration = expiration && dropoff > expiration;
                  if (!beforePrepared && !afterExpiration) return null;
                  const message = beforePrepared ? 'Dropoff is before date prepared' : 'Dropoff is after expiration';
                  return (
                    <div className="group/warn relative">
                      <svg className="w-5 h-5 text-amber-500 shrink-0 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/warn:block">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                          {message}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <button
                  onClick={() => setEditingDropoffDate(!editingDropoffDate)}
                  className="text-sm font-semibold text-gray-900 hover:text-pink-600 hover:bg-gray-50 px-2 -mr-2 rounded transition-colors group/drop flex items-center gap-1.5"
                >
                  {delivery.dropoffDate
                    ? format(new Date(delivery.dropoffDate + 'T00:00:00'), 'MMM d, yyyy')
                    : 'Set date'
                  }
                  <svg className="text-gray-300 group-hover/drop:text-gray-400 shrink-0 transition-colors" style={{ width: '1em', height: '1em' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {editingDropoffDate && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setEditingDropoffDate(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
                      <DayPicker
                        mode="single"
                        selected={delivery.dropoffDate ? new Date(delivery.dropoffDate + 'T00:00:00') : undefined}
                        defaultMonth={delivery.dropoffDate ? new Date(delivery.dropoffDate + 'T00:00:00') : new Date(delivery.datePrepared + 'T00:00:00')}
                        onSelect={(date) => updateDropoffDate(date ?? null)}
                        className="!font-sans"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Expiration Date */}
            <div className="flex items-center justify-between ">
              <span className="text-sm font-medium text-gray-500">Expiration</span>
              {delivery.expirationDate ? (
                <span className={`text-sm font-semibold px-2 -mr-2 ${expirationStatus.color} flex items-center gap-1.5`}>
                  {format(new Date(delivery.expirationDate + 'T00:00:00'), 'MMM d, yyyy')}
                  <svg className="invisible shrink-0" style={{ width: '1em', height: '1em' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </span>
              ) : (
                <span className="text-sm text-gray-400 px-2 -mr-2 flex items-center gap-1.5">
                  Not set
                  <svg className="invisible shrink-0" style={{ width: '1em', height: '1em' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details Card */}
        <div
          className="bg-white rounded-2xl"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Invoice Details</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Additional Fees</span>
              <EditableNumber
                value={delivery.additionalFees || 0}
                onSave={(val) => updateDelivery('additionalFees', val)}
                isCurrency
                inline
                className="text-sm font-semibold text-gray-900 cursor-text"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Discount</span>
              <EditableNumber
                value={delivery.discount || 0}
                onSave={(val) => updateDelivery('discount', val)}
                isCurrency
                inline
                className="text-sm font-semibold text-gray-900 cursor-text"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Prepaid Amount</span>
              <EditableNumber
                value={delivery.prepaidAmount || 0}
                onSave={(val) => updateDelivery('prepaidAmount', val)}
                isCurrency
                inline
                className="text-sm font-semibold text-gray-900 cursor-text"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Payments Collected</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">💵</span>
                <span className="text-sm font-medium text-gray-700">Cash</span>
              </div>
              <EditableText
                value={delivery.cashCollected ? formatCurrency(delivery.cashCollected) : '$0.00'}
                onSave={(value) => updateDelivery('cashCollected', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                className="text-sm font-semibold text-gray-900"
                allowEmpty
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📱</span>
                <span className="text-sm font-medium text-gray-700">Venmo</span>
              </div>
              <EditableText
                value={delivery.venmoCollected ? formatCurrency(delivery.venmoCollected) : '$0.00'}
                onSave={(value) => updateDelivery('venmoCollected', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                className="text-sm font-semibold text-gray-900"
                allowEmpty
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">💳</span>
                <span className="text-sm font-medium text-gray-700">Other</span>
              </div>
              <EditableText
                value={delivery.otherCollected ? formatCurrency(delivery.otherCollected) : '$0.00'}
                onSave={(value) => updateDelivery('otherCollected', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                className="text-sm font-semibold text-gray-900"
                allowEmpty
              />
            </div>
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total Collected</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency((delivery.cashCollected || 0) + (delivery.venmoCollected || 0) + (delivery.otherCollected || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Download Invoice */}
        <button
          onClick={handleDownloadInvoice}
          className="w-full px-6 py-2.5 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Invoice
        </button>

      </div>
    </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Add Flavor Modal */}
      {showAddFlavor && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowAddFlavor(false); resetAddFlavorForm(); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Flavor to Delivery</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Flavor</label>
                <select
                  value={selectedFlavorId}
                  onChange={(e) => {
                    const flavorId = e.target.value ? parseInt(e.target.value) : '';
                    setSelectedFlavorId(flavorId);
                    // Auto-select first available rate for this flavor
                    if (flavorId) {
                      const rates = flavorPrices.filter(p => p.flavorId === flavorId);
                      setSelectedRateId(rates.length > 0 ? rates[0].id : '');
                    } else {
                      setSelectedRateId('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Choose a flavor...</option>
                  {availableFlavors.filter(f => f.isActive).map(flavor => (
                    <option key={flavor.id} value={flavor.id}>
                      {flavor.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFlavorId && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <select
                    value={selectedRateId}
                    onChange={(e) => setSelectedRateId(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Choose a rate...</option>
                    {flavorPrices.filter(p => p.flavorId === selectedFlavorId).map(rate => (
                      <option key={rate.id} value={rate.id}>
                        {rate.tierName} — ${rate.price.toFixed(2)}{rate.cost != null ? ` / $${rate.cost.toFixed(2)} cost` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prepared Qty</label>
                <input
                  type="number"
                  value={newItemData.prepared}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, prepared: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAddFlavor(false); resetAddFlavorForm(); }}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFlavor}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors"
                >
                  Add Flavor
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, sublabel, highlight }: { label: string; value: string; sublabel?: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl ${highlight ? 'bg-pink-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-pink-600' : 'text-gray-900'}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}

// Editable Text Component
function EditableText({ value, onSave, className, allowEmpty = false, multiline = false }: { value: string; onSave: (value: string) => void; className?: string; allowEmpty?: boolean; multiline?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      if (allowEmpty || editValue.trim()) {
        onSave(editValue);
      } else {
        setEditValue(value);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          rows={3}
          className={`${className} bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg px-2 py-1 w-full resize-none`}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        size={Math.max(editValue.length, 1)}
        className={`${className} bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg px-2`}
      />
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className={`${className} cursor-text hover:bg-gray-50 rounded-lg px-2 -mx-2 whitespace-pre-wrap group/edit flex items-center gap-2`}>
      {value}
      <svg className="text-gray-300 group-hover/edit:text-gray-400 shrink-0 transition-colors" style={{ width: '1em', height: '1em' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </div>
  );
}

// Editable Number Component for table cells
function EditableNumber({ value, onSave, isCurrency = false, className, inline = false, showPencil = false }: { value: number; onSave: (value: number) => void; isCurrency?: boolean; className?: string; inline?: boolean; showPencil?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleSave = () => {
    const numValue = Math.max(0, parseFloat(editValue) || 0);
    if (numValue !== value) {
      onSave(numValue);
    }
    setEditValue(numValue.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  const formatDisplay = (num: number) => {
    if (isCurrency) {
      return `$${num.toFixed(2)}`;
    }
    return num.toString();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={isCurrency ? '0.01' : '1'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={inline
          ? "w-16 text-right text-sm bg-white border border-pink-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded px-1 py-0.5"
          : "w-full text-right text-sm bg-white border border-pink-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded px-1 py-0.5"
        }
      />
    );
  }

  const pencilIcon = (
    <svg className="text-gray-300 group-hover/num:text-gray-400 shrink-0 transition-colors" style={{ width: '1em', height: '1em' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`${className || "editable-cell text-gray-600 text-sm text-center justify-center cursor-text"} group/num inline-flex items-center gap-1.5`}
    >
      {showPencil && pencilIcon}
      {formatDisplay(value)}
      {inline && pencilIcon}
    </span>
  );
}

// Simple Notes Textarea Component (no rich text editor)
function NotesEditor({ content, onSave }: { content: string; onSave: (content: string) => void }) {
  const [value, setValue] = useState(content || '');
  const [QuillComponent, setQuillComponent] = useState<QuillComponentType | null>(null);
  const lastSavedContent = useRef(content);

  useEffect(() => {
    let mounted = true;
    import('react-quill-new').then((mod) => {
      if (mounted) {
        import('react-quill-new/dist/quill.snow.css');
        setQuillComponent(() => mod.default as unknown as QuillComponentType);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (content !== lastSavedContent.current) {
      setValue(content || '');
      lastSavedContent.current = content;
    }
  }, [content]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const handleBlur = () => {
    if (value !== lastSavedContent.current) {
      lastSavedContent.current = value;
      onSave(value);
    }
  };

  const modules: QuillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
    ],
  };

  const formats: string[] = ['bold', 'italic', 'underline'];

  if (!QuillComponent) {
    return (
      <div className="notes-editor">
        <div className="border border-gray-200 rounded-xl bg-white min-h-[160px] p-4 text-gray-400 text-sm">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="notes-editor">
      <QuillComponent
        theme="snow"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        modules={modules}
        formats={formats}
        placeholder="Add notes..."
      />
    </div>
  );
}

// Hold-to-Delete Button Component
function HoldDeleteButton({ onDelete }: { onDelete: () => void }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const holdDuration = 800;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = useCallback(() => {
    setHolding(true);
    setReady(false);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / holdDuration, 1);
      setProgress(pct);
      if (pct >= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setReady(true);
      }
    }, 16);
  }, [holdDuration]);

  const releaseHold = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (ready) {
      onDelete();
    }
    setHolding(false);
    setProgress(0);
    setReady(false);
  }, [ready, onDelete]);

  const cancelHold = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setHolding(false);
    setProgress(0);
    setReady(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={releaseHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={releaseHold}
      className="relative overflow-hidden rounded-full w-16 py-1 text-xs font-medium transition-all select-none text-center"
      style={{
        background: holding
          ? `linear-gradient(90deg, rgba(239,68,68,${0.3 + progress * 0.7}) ${progress * 100}%, #fef2f2 ${progress * 100}%)`
          : '#fef2f2',
        color: progress > 0.5 ? 'white' : '#ef4444',
        border: `1px solid ${progress > 0 ? `rgba(239,68,68,${0.3 + progress * 0.7})` : '#fecaca'}`,
      }}
      title="Hold to delete"
    >
      {progress > 0 ? (progress >= 0.8 ? 'Release' : 'Hold...') : 'Delete'}
    </button>
  );
}

// Sortable Header Component
type SortColumn = 'id' | 'flavorName' | 'prepared' | 'revenue' | 'unitCost' | 'cogs' | 'profit';

function SortableHeader({
  column,
  label,
  currentSort,
  direction,
  onSort,
  className = '',
  style
}: {
  column: SortColumn;
  label: string;
  currentSort: SortColumn;
  direction: 'asc' | 'desc';
  onSort: (column: SortColumn) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isActive = currentSort === column;

  return (
    <th
      className={`${className} cursor-pointer hover:bg-gray-50 transition-colors select-none`}
      onClick={() => onSort(column)}
      style={style}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : ''}`}>
        <span>{label}</span>
        {isActive && (
          <span className="text-[10px] text-pink-500">
            {direction === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
  );
}
