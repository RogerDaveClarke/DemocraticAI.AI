import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Save, CheckCircle, AlertCircle, FileText, Loader2, Shield } from 'lucide-react';
import { 
  saveBillSecurely, 
  loadBillSecurely, 
  listBillsSecurely, 
  deleteBillSecurely 
} from '../../../utils/encryptedBillStorage';

interface SavedBill {
  id: string;
  title: string;
  content: string;
  lastModified: string;
}

interface ReviewResult {
  isValid: boolean;
  score: number;
  feedback: {
    category: string;
    status: 'success' | 'warning' | 'error';
    message: string;
  }[];
}

const BILL_TEMPLATE = `# [Your Bill Title Here]

## Preamble

WHEREAS the people of Ireland recognize the need for [state the purpose/problem];

WHEREAS it is in the public interest to [state the benefit];

NOW, THEREFORE, be it enacted by the Oireachtas as follows:

---

## Section 1: Short Title and Commencement

1.1 This Act may be cited as the [Bill Title] Act 2025.

1.2 This Act shall come into operation on such day as the Minister may appoint by order.

---

## Section 2: Definitions

In this Act—

**"[Term]"** means [definition];

**"Minister"** means the Minister for [relevant department];

---

## Section 3: Main Provisions

3.1 [State the main provision or action to be taken]

3.2 [Add additional clauses as needed]

3.3 [Each clause should be clear and specific]

---

## Section 4: Powers and Duties

4.1 The Minister shall have the power to [specify power or duty].

4.2 [Add additional powers/duties as needed]

---

## Section 5: Penalties

5.1 A person who contravenes this Act shall be guilty of an offence and shall be liable—
   - (a) on summary conviction, to a fine not exceeding €5,000, or
   - (b) on conviction on indictment, to a fine not exceeding €50,000 or imprisonment for a term not exceeding 2 years, or both.

---

## Section 6: Regulations

6.1 The Minister may make regulations for the purpose of giving effect to this Act.

6.2 Every regulation made under this section shall be laid before each House of the Oireachtas.

---

## Section 7: Repeals and Amendments

7.1 [Specify any existing Acts that are repealed or amended by this Bill]

---

**EXPLANATORY NOTE**

(This note is not part of the Act and merely indicates its general purport)

[Provide a brief explanation of the Bill's purpose and main provisions]
`;

// Bill validation and review logic
const reviewBill = (title: string, content: string): ReviewResult => {
  const feedback: ReviewResult['feedback'] = [];
  let score = 0;
  const maxScore = 100;

  // Rule 1: Check for title
  if (!title || title.trim().length === 0) {
    feedback.push({
      category: 'Title',
      status: 'error',
      message: 'Your bill must have a title. Please provide a clear, descriptive title.'
    });
  } else if (title.trim().length < 10) {
    feedback.push({
      category: 'Title',
      status: 'warning',
      message: 'Your title is quite short. Consider making it more descriptive.'
    });
    score += 10;
  } else {
    feedback.push({
      category: 'Title',
      status: 'success',
      message: 'Title is present and descriptive.'
    });
    score += 15;
  }

  // Rule 2: Check for content length
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < 50) {
    feedback.push({
      category: 'Length',
      status: 'error',
      message: `Your bill is too short (${wordCount} words). A substantive bill should have at least 50 words. Please add more detail.`
    });
  } else if (wordCount < 100) {
    feedback.push({
      category: 'Length',
      status: 'warning',
      message: `Your bill has ${wordCount} words. Consider adding more detail to strengthen your legislation.`
    });
    score += 10;
  } else {
    feedback.push({
      category: 'Length',
      status: 'success',
      message: `Your bill has a substantive length (${wordCount} words).`
    });
    score += 15;
  }

  // Rule 3: Check for Preamble
  if (content.toLowerCase().includes('whereas')) {
    feedback.push({
      category: 'Preamble',
      status: 'success',
      message: 'Your bill includes a preamble with "WHEREAS" clauses, which is excellent for providing context.'
    });
    score += 15;
  } else {
    feedback.push({
      category: 'Preamble',
      status: 'warning',
      message: 'Consider adding a preamble with "WHEREAS" clauses to explain the purpose and context of your bill.'
    });
    score += 5;
  }

  // Rule 4: Check for Enacting Clause
  if (content.toLowerCase().includes('be it enacted') || content.toLowerCase().includes('enacted by')) {
    feedback.push({
      category: 'Enacting Clause',
      status: 'success',
      message: 'Your bill includes the formal enacting clause.'
    });
    score += 15;
  } else {
    feedback.push({
      category: 'Enacting Clause',
      status: 'error',
      message: 'Your bill must include an enacting clause such as "NOW, THEREFORE, be it enacted by the Oireachtas as follows:"'
    });
  }

  // Rule 5: Check for Sections
  const sectionMatches = content.match(/#{1,3}\s*Section\s+\d+/gi);
  const sectionCount = sectionMatches ? sectionMatches.length : 0;
  
  if (sectionCount === 0) {
    feedback.push({
      category: 'Structure',
      status: 'error',
      message: 'Your bill must be divided into numbered sections (e.g., "Section 1", "Section 2"). This is required for all legislation.'
    });
  } else if (sectionCount < 3) {
    feedback.push({
      category: 'Structure',
      status: 'warning',
      message: `Your bill has ${sectionCount} section(s). Most bills have at least 3-5 sections. Consider adding more sections to fully develop your legislation.`
    });
    score += 10;
  } else {
    feedback.push({
      category: 'Structure',
      status: 'success',
      message: `Your bill is well-structured with ${sectionCount} sections.`
    });
    score += 20;
  }

  // Rule 6: Check for formal language
  const informalWords = ['gonna', 'wanna', 'yeah', 'nope', 'kinda', 'sorta'];
  const foundInformal = informalWords.filter(word => 
    content.toLowerCase().includes(word)
  );

  if (foundInformal.length > 0) {
    feedback.push({
      category: 'Language',
      status: 'warning',
      message: `Avoid informal language. Found: "${foundInformal.join('", "')}". Use formal, precise language appropriate for legislation.`
    });
    score += 5;
  } else {
    feedback.push({
      category: 'Language',
      status: 'success',
      message: 'Your bill uses appropriately formal language.'
    });
    score += 15;
  }

  // Rule 7: Check for definitions section
  if (content.toLowerCase().includes('definition')) {
    feedback.push({
      category: 'Definitions',
      status: 'success',
      message: 'Your bill includes a definitions section, which is good practice for clarity.'
    });
    score += 10;
  } else {
    feedback.push({
      category: 'Definitions',
      status: 'warning',
      message: 'Consider adding a definitions section to clarify key terms used in your bill.'
    });
    score += 5;
  }

  // Determine if valid (must have no errors)
  const hasErrors = feedback.some(f => f.status === 'error');
  const isValid = !hasErrors && score >= 60;

  return {
    isValid,
    score: Math.min(score, maxScore),
    feedback
  };
};

export function CreateYourOwnBill() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(BILL_TEMPLATE);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved bills on mount
  useEffect(() => {
    const loadBills = async () => {
      setIsLoading(true);
      try {
        const bills = await listBillsSecurely();
        setSavedBills(bills);
      } catch (error) {
        console.error('Failed to load bills:', error);
        alert('Failed to load your saved bills. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBills();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your bill before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const bill: SavedBill = {
        id: selectedBillId || `bill_${Date.now()}`,
        title: title.trim(),
        content,
        lastModified: new Date().toISOString()
      };

      await saveBillSecurely(bill);
      
      // Reload the bills list
      const updatedBills = await listBillsSecurely();
      setSavedBills(updatedBills);
      
      setSelectedBillId(bill.id);
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } catch (error) {
      console.error('Failed to save bill:', error);
      alert('Failed to save your bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadBill = async (billId: string) => {
    if (!billId) return;
    
    setIsLoading(true);
    try {
      const bill = await loadBillSecurely(billId);
      if (bill) {
        setTitle(bill.title);
        setContent(bill.content);
        setSelectedBillId(bill.id);
        setReviewResult(null);
      }
    } catch (error) {
      console.error('Failed to load bill:', error);
      alert('Failed to load the selected bill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewBill = () => {
    setTitle('');
    setContent(BILL_TEMPLATE);
    setSelectedBillId('');
    setReviewResult(null);
  };

  const handleDeleteBill = async (billId: string) => {
    if (confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await deleteBillSecurely(billId);
        const updatedBills = await listBillsSecurely();
        setSavedBills(updatedBills);
        
        if (selectedBillId === billId) {
          handleNewBill();
        }
      } catch (error) {
        console.error('Failed to delete bill:', error);
        alert('Failed to delete the bill. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReview = () => {
    const result = reviewBill(title, content);
    setReviewResult(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Create Your Own Bill</h1>
                <p className="text-gray-600">Draft legislation like a real TD</p>
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {showInstructions ? 'Hide' : 'Show'} Instructions
            </button>
          </div>

          {/* Instructions Panel */}
          {showInstructions && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-bold text-blue-900 mb-2">📜 How to Write a Bill</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>Title:</strong> Give your bill a clear, descriptive title (e.g., "Climate Action Bill 2025")</li>
                <li>• <strong>Preamble:</strong> Start with "WHEREAS" clauses explaining why the bill is needed</li>
                <li>• <strong>Enacting Clause:</strong> Include "NOW, THEREFORE, be it enacted by the Oireachtas as follows:"</li>
                <li>• <strong>Sections:</strong> Divide your bill into numbered sections (Section 1, Section 2, etc.)</li>
                <li>• <strong>Definitions:</strong> Define key terms used in your bill</li>
                <li>• <strong>Language:</strong> Use formal, precise language. Avoid casual or conversational tone</li>
                <li>• <strong>Security:</strong> Your bills are encrypted in your browser with AES-256 before being securely stored in the cloud. Even administrators cannot read your content.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Save Confirmation */}
        {showSaveConfirmation && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Bill saved successfully and encrypted!</span>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong className="font-bold">🔒 Your Privacy is Protected</strong>
              <p className="mt-1">
                Your bills are encrypted in your browser before being saved to secure cloud storage. 
                The encryption key is derived from your session and never leaves your device. 
                This means even GCP administrators cannot read your bills - only you can decrypt them.
              </p>
            </div>
          </div>
        </div>

        {/* Review Results */}
        {reviewResult && (
          <div className={`rounded-lg shadow-lg p-6 mb-6 ${
            reviewResult.isValid ? 'bg-green-50 border-2 border-green-500' : 'bg-orange-50 border-2 border-orange-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {reviewResult.isValid ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-orange-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Bill Review Results
                </h2>
                <p className="text-gray-600">
                  Score: {reviewResult.score}/100 - {
                    reviewResult.isValid 
                      ? '✅ Ready for submission!' 
                      : '⚠️ Needs improvement before submission'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {reviewResult.feedback.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    item.status === 'success' 
                      ? 'bg-green-100 border-green-500 text-green-900'
                      : item.status === 'warning'
                      ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                      : 'bg-red-100 border-red-500 text-red-900'
                  }`}
                >
                  <div className="font-bold">{item.category}</div>
                  <div className="text-sm">{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Climate Action Bill 2025"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Load Saved Bill
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedBillId}
                  onChange={(e) => handleLoadBill(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a bill --</option>
                  {savedBills.map((bill) => (
                    <option key={bill.id} value={bill.id}>
                      {bill.title} ({new Date(bill.lastModified).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {selectedBillId && (
                  <button
                    onClick={() => handleDeleteBill(selectedBillId)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleNewBill}
              disabled={isLoading || isSaving}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              New Bill
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Securely...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Bill
                </>
              )}
            </button>
            <button
              onClick={handleReview}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Review Bill
            </button>
          </div>
        </div>

        {/* Markdown Editor */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bill Content (Markdown Format)
          </label>
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              height={600}
              preview="edit"
              hideToolbar={false}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Use markdown formatting (# for headings, ** for bold, etc.) to structure your bill professionally.
            <br />
            🔒 Security: Your bills are encrypted client-side with AES-256-GCM before being uploaded to GCP Cloud Storage.
            Even GCP administrators cannot read your content.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateYourOwnBill;
