import { Send } from 'lucide-react';

interface WelcomeScreenProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export const WelcomeScreen = ({ 
  input, 
  setInput, 
  handleSubmit, 
  isLoading 
}: WelcomeScreenProps) => (
  <div className="flex items-center justify-center flex-1 px-4">
    <div className="w-full max-w-3xl mx-auto text-center">
      <h1 className="mb-4 text-6xl font-bold text-transparent uppercase bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text">
        <span className="text-white">Agent IA</span> Calvados
      </h1>
      <p className="w-2/3 mx-auto mb-6 text-lg text-gray-400">
        Votre assistant intelligent au service des citoyens du Calvados. 
        Posez vos questions sur les services publics, les démarches administratives, 
        ou toute information concernant le département.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="relative max-w-xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Comment puis-je vous aider aujourd'hui ? (services publics, démarches, informations sur le Calvados...)"
            className="w-full py-3 pl-4 pr-12 overflow-hidden text-sm text-white placeholder-gray-400 border rounded-lg resize-none border-blue-500/20 bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            rows={1}
            style={{ minHeight: '88px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute p-2 text-blue-500 transition-colors -translate-y-1/2 right-2 top-1/2 hover:text-blue-400 disabled:text-gray-500 focus:outline-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  </div>
); 