import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

type TabType = "contract-collaboration" | "database-system";

interface Contract {
  id: string;
  type: string;
  supplierName: string;
  status: string;
  basePricing: Array<{ size: string; price: number }>;
  sizePenalties: Array<{ sizeRange: string; penaltyAmount: number; unit: string }>;
  deliveryDetails: Array<{ date: string; quantity: number; unit: string; sizeRange: string }>;
  createdAt: Date;
}

interface NewContractForm {
  contractId: string;
  type: string;
  supplierName: string;
  status: string;
  basePricing: Array<{ id: string; size: string; price: string }>;
  sizePenalties: Array<{ id: string; sizeRange: string; penaltyAmount: string; unit: string }>;
  deliveryDetails: Array<{ id: string; date: string; quantity: string; unit: string; sizeRange: string }>;
}

const GeneralManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("contract-collaboration");
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([
    // Existing sample contracts
    {
      id: "L50302.048.00",
      type: "New",
      supplierName: "SAIDY",
      status: "Open",
      basePricing: [
        { size: "20", price: 88 },
        { size: "25", price: 88 },
        { size: "30", price: 80 },
        { size: "40", price: 77 }
      ],
      sizePenalties: [
        { sizeRange: "100-150", penaltyAmount: 200, unit: "Rp/sz" }
      ],
      deliveryDetails: [
        { date: "27 Mei", quantity: 7, unit: "mt", sizeRange: "20/25/30/40" }
      ],
      createdAt: new Date()
    }
  ]);

  const [formData, setFormData] = useState<NewContractForm>({
    contractId: "",
    type: "New",
    supplierName: "",
    status: "Open", 
    basePricing: [{ id: crypto.randomUUID(), size: "", price: "" }],
    sizePenalties: [{ id: crypto.randomUUID(), sizeRange: "", penaltyAmount: "", unit: "Rp/s" }],
    deliveryDetails: [{ id: crypto.randomUUID(), date: "", quantity: "", unit: "mt", sizeRange: "" }]
  });

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const generateContractId = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `L${timestamp}.${random}.00`;
  };

  const handleFormChange = (field: keyof NewContractForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateBasePricing = (id: string, field: 'size' | 'price', value: string) => {
    setFormData(prev => ({
      ...prev,
      basePricing: prev.basePricing.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateSizePenalty = (id: string, field: 'sizeRange' | 'penaltyAmount' | 'unit', value: string) => {
    setFormData(prev => ({
      ...prev,
      sizePenalties: prev.sizePenalties.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateDeliveryDetail = (id: string, field: 'date' | 'quantity' | 'unit' | 'sizeRange', value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryDetails: prev.deliveryDetails.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addBasePricing = () => {
    setFormData(prev => ({
      ...prev,
      basePricing: [...prev.basePricing, { id: crypto.randomUUID(), size: "", price: "" }]
    }));
  };

  const addSizePenalty = () => {
    setFormData(prev => ({
      ...prev,
      sizePenalties: [...prev.sizePenalties, { id: crypto.randomUUID(), sizeRange: "", penaltyAmount: "", unit: "Rp/s" }]
    }));
  };

  const addDeliveryDetail = () => {
    setFormData(prev => ({
      ...prev,
      deliveryDetails: [...prev.deliveryDetails, { id: crypto.randomUUID(), date: "", quantity: "", unit: "mt", sizeRange: "" }]
    }));
  };

  const handleSaveContract = () => {
    // Validate form
    if (!formData.supplierName.trim()) {
      alert("Please enter supplier name");
      return;
    }
    
    if (!formData.contractId.trim()) {
      alert("Please enter contract ID");
      return;
    }

    // Create new contract
    const newContract: Contract = {
      id: formData.contractId,
      type: formData.type,
      supplierName: formData.supplierName,
      status: formData.status,
      basePricing: formData.basePricing.filter(bp => bp.size && bp.price).map(bp => ({
        size: bp.size,
        price: parseFloat(bp.price) || 0
      })),
      sizePenalties: formData.sizePenalties.filter(sp => sp.sizeRange && sp.penaltyAmount).map(sp => ({
        sizeRange: sp.sizeRange,
        penaltyAmount: parseFloat(sp.penaltyAmount) || 0,
        unit: sp.unit
      })),
      deliveryDetails: formData.deliveryDetails.filter(dd => dd.date && dd.quantity).map(dd => ({
        date: dd.date,
        quantity: parseFloat(dd.quantity) || 0,
        unit: dd.unit,
        sizeRange: dd.sizeRange
      })),
      createdAt: new Date()
    };

    // Add to contracts list
    setContracts(prev => [newContract, ...prev]);
    
    // Reset form and close modal
    setFormData({
      contractId: "",
      type: "New",
      supplierName: "",
      status: "Open",
      basePricing: [{ id: crypto.randomUUID(), size: "", price: "" }],
      sizePenalties: [{ id: crypto.randomUUID(), sizeRange: "", penaltyAmount: "", unit: "Rp/s" }],
      deliveryDetails: [{ id: crypto.randomUUID(), date: "", quantity: "", unit: "mt", sizeRange: "" }]
    });
    setShowNewContractModal(false);
  };


  const TabButton: React.FC<{
    tab: TabType;
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? "text-blue-600 border-blue-600"
          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  const ContractCollaborationTab: React.FC = () => (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contract Collaboration (V2)</h2>
        <button 
          onClick={() => setShowNewContractModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Collaborative Contract</span>
        </button>
      </div>

      {/* Contract Cards */}
      <div className="space-y-6">
        {contracts.map((contract) => (
          <div key={contract.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Title Section - White Background */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    ({contract.type}) {contract.id} {contract.supplierName} {contract.status}
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    contract.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                    </svg>
                    {contract.status === 'Open' ? 'Supplier Filled' : 'Closed'}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="bg-yellow-500 text-white p-2 rounded shadow hover:bg-yellow-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content Section - Light Grey Background */}
            <div className="bg-gray-100 px-6 py-4">
              <div className="text-gray-800 font-mono text-sm leading-relaxed text-left">
                <div className="mb-3">({contract.type}) {contract.id} {contract.supplierName} {contract.status}</div>
                
                {/* Delivery Details */}
                {contract.deliveryDetails.map((delivery, idx) => (
                  <div key={idx} className="mb-3">{delivery.date} {delivery.quantity}{delivery.unit},</div>
                ))}
                
                {/* Base Pricing */}
                <div className="mb-2">
                  {contract.basePricing.map(bp => bp.size).join('/')}@
                </div>
                <div className="mb-3">
                  {contract.basePricing.map(bp => bp.price).join('/')},
                </div>
                
                {/* Size Penalties */}
                {contract.sizePenalties.map((penalty, idx) => (
                  <div key={idx}>Sz {penalty.sizeRange} turun {penalty.penaltyAmount} {penalty.unit}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {contracts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No contracts yet. Create your first collaborative contract!</p>
          </div>
        )}
      </div>
    </div>
  );

  const DatabaseSystemTab: React.FC = () => (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Database System (V1)</h2>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Database Entry</span>
          </button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
            </svg>
            <span>Import Excel</span>
          </button>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Database Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bongkar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ton</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dynamic Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">L50302.048.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2025-05-23</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">SAIDY</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">30-May-25</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10 sd 40</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">11</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="space-y-1">
                    <div className="text-blue-600">20: $88</div>
                    <div className="text-blue-600">30: $80</div>
                    <div className="text-blue-600">40: $77</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">365</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">28-5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-green-600 hover:text-green-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🦐</span>
              <h1 className="text-2xl font-bold text-gray-900">
                General Manager Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <TabButton
              tab="database-system"
              icon="DB"
              label="Database System"
              isActive={activeTab === "database-system"}
              onClick={() => setActiveTab("database-system")}
            />
            <TabButton
              tab="contract-collaboration"
              icon="CC"
              label="Contract Collaboration"
              isActive={activeTab === "contract-collaboration"}
              onClick={() => setActiveTab("contract-collaboration")}
            />
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "contract-collaboration" && <ContractCollaborationTab />}
          {activeTab === "database-system" && <DatabaseSystemTab />}
        </div>
      </div>

      {/* New Contract Modal */}
      {showNewContractModal && (
        <NewContractModal 
          formData={formData}
          onClose={() => setShowNewContractModal(false)}
          onSave={handleSaveContract}
          addBasePricing={addBasePricing}
          addSizePenalty={addSizePenalty}
          addDeliveryDetail={addDeliveryDetail}
          handleFormChange={handleFormChange}
          updateBasePricing={updateBasePricing}
          updateSizePenalty={updateSizePenalty}
          updateDeliveryDetail={updateDeliveryDetail}
        />
      )}
    </div>
  );
};

// Separate Modal Component to prevent re-rendering issues
interface NewContractModalProps {
  formData: NewContractForm;
  onClose: () => void;
  onSave: () => void;
  addBasePricing: () => void;
  addSizePenalty: () => void;
  addDeliveryDetail: () => void;
  handleFormChange: (field: keyof NewContractForm, value: any) => void;
  updateBasePricing: (id: string, field: 'size' | 'price', value: string) => void;
  updateSizePenalty: (id: string, field: 'sizeRange' | 'penaltyAmount' | 'unit', value: string) => void;
  updateDeliveryDetail: (id: string, field: 'date' | 'quantity' | 'unit' | 'sizeRange', value: string) => void;
}

const NewContractModal: React.FC<NewContractModalProps> = React.memo(({
  formData,
  onClose,
  onSave,
  addBasePricing,
  addSizePenalty,
  addDeliveryDetail,
  handleFormChange,
  updateBasePricing,
  updateSizePenalty,
  updateDeliveryDetail
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">New Contract</h3>
          
          <div className="space-y-6">
            {/* Contract Type and ID Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  value={formData.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New">New</option>
                  <option value="Add">Add</option>
                  <option value="Change">Change</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Unique ID (L.xxx)"
                  value={formData.contractId}
                  onChange={(e) => handleFormChange('contractId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Supplier Name and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Supplier Name"
                  value={formData.supplierName}
                  onChange={(e) => handleFormChange('supplierName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Base Pricing Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-gray-900">Base Pricing (CEO sets this)</h4>
                <button
                  type="button"
                  onClick={addBasePricing}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add Size</span>
                </button>
              </div>
              <div className="space-y-2">
                {formData.basePricing.map((pricing) => (
                  <div key={pricing.id} className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Size"
                      value={pricing.size}
                      onChange={(e) => updateBasePricing(pricing.id, 'size', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Price (k Rupiah)"
                      value={pricing.price}
                      onChange={(e) => updateBasePricing(pricing.id, 'price', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Size Penalties Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-gray-900">Size Penalties (Turun)</h4>
                <button
                  type="button"
                  onClick={addSizePenalty}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add Range</span>
                </button>
              </div>
              <div className="space-y-2">
                {formData.sizePenalties.map((penalty) => (
                  <div key={penalty.id} className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Size Range (e.g., 100-150)"
                      value={penalty.sizeRange}
                      onChange={(e) => updateSizePenalty(penalty.id, 'sizeRange', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Penalty Amount"
                      value={penalty.penaltyAmount}
                      onChange={(e) => updateSizePenalty(penalty.id, 'penaltyAmount', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={penalty.unit}
                      onChange={(e) => updateSizePenalty(penalty.id, 'unit', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Rp/s">Rp/s</option>
                      <option value="Rp/kg">Rp/kg</option>
                      <option value="Rp/sz">Rp/sz</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-gray-900">Delivery Details (Supplier fills this)</h4>
                <button
                  type="button"
                  onClick={addDeliveryDetail}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add Delivery</span>
                </button>
              </div>
              <div className="space-y-2">
                {formData.deliveryDetails.map((delivery) => (
                  <div key={delivery.id} className="grid grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Date (e.g., 27 Mei)"
                      value={delivery.date}
                      onChange={(e) => updateDeliveryDetail(delivery.id, 'date', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Quantity"
                      value={delivery.quantity}
                      onChange={(e) => updateDeliveryDetail(delivery.id, 'quantity', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={delivery.unit}
                      onChange={(e) => updateDeliveryDetail(delivery.id, 'unit', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mt">mt</option>
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Size Range (e.g., 30-90)"
                      value={delivery.sizeRange}
                      onChange={(e) => updateDeliveryDetail(delivery.id, 'sizeRange', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Contract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

NewContractModal.displayName = 'NewContractModal';

export default GeneralManagerDashboard;
