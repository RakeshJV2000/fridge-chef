import { useCallback, useRef, useState } from 'react'

const API = 'http://localhost:8000'

const STEPS = ['Upload', 'Ingredients', 'Recipes']
const STEP_KEYS = ['upload', 'ingredients', 'results']

function StepBar({ step }) {
  const current = STEP_KEYS.indexOf(step)
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-400'}`}
            >
              {done ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium ${active ? 'text-emerald-700' : done ? 'text-emerald-500' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 transition-colors ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Spinner({ message }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-emerald-700 font-medium text-sm">{message}</p>
    </div>
  )
}

function IngredientChip({ name, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-sm font-medium border border-emerald-200">
      {name}
      <button
        onClick={onRemove}
        className="text-emerald-400 hover:text-red-500 transition-colors leading-none ml-0.5"
        aria-label={`Remove ${name}`}
      >
        ×
      </button>
    </span>
  )
}

function RecipeCard({ recipe }) {
  const allGood = recipe.missing.length === 0
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-44 object-cover"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{recipe.title}</h3>
        {allGood && (
          <p className="text-emerald-600 text-sm font-medium mb-3">
            You have everything needed!
          </p>
        )}
        <div className="grid grid-cols-2 gap-5 mt-3">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              You have ({recipe.have.length})
            </p>
            <ul className="space-y-1.5">
              {recipe.have.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span>{ing.name}{ing.amount ? ` — ${ing.amount}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-2">
              Missing ({recipe.missing.length})
            </p>
            {recipe.missing.length === 0 ? (
              <p className="text-sm text-emerald-500 font-medium">Nothing! 🎉</p>
            ) : (
              <ul className="space-y-1.5">
                {recipe.missing.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    <span>{ing.name}{ing.amount ? ` — ${ing.amount}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ShoppingList({ recipes }) {
  const [copied, setCopied] = useState(false)
  const items = [...new Set(recipes.flatMap(r => r.missing.map(i => i.name)))]

  if (items.length === 0) return null

  const copy = async () => {
    await navigator.clipboard.writeText(items.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-amber-800 text-base">Shopping List</h3>
        <button
          onClick={copy}
          className="text-xs px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-full font-medium transition-colors"
        >
          {copied ? 'Copied!' : 'Copy list'}
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-amber-900">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [newIngredient, setNewIngredient] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef()

  const setFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, etc.)')
      return
    }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    setFile(e.dataTransfer.files[0])
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const analyzeImage = async () => {
    setLoading(true)
    setLoadingMsg('Scanning your fridge with AI…')
    setError('')
    try {
      const form = new FormData()
      form.append('image', imageFile)
      const res = await fetch(`${API}/analyze-fridge`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to analyze image.')
      setIngredients(data.ingredients)
      setStep('ingredients')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const findRecipes = async () => {
    if (ingredients.length === 0) {
      setError('Add at least one ingredient before searching.')
      return
    }
    setLoading(true)
    setLoadingMsg('Finding recipes you can make…')
    setError('')
    try {
      const res = await fetch(`${API}/find-recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to find recipes.')
      setRecipes(data.recipes)
      setStep('results')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setImageFile(null)
    setImagePreview(null)
    setIngredients([])
    setRecipes([])
    setError('')
    setNewIngredient('')
  }

  const addIngredient = (e) => {
    e.preventDefault()
    const val = newIngredient.trim().toLowerCase()
    if (val && !ingredients.map(i => i.toLowerCase()).includes(val)) {
      setIngredients(prev => [...prev, newIngredient.trim()])
      setNewIngredient('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="text-center pt-12 pb-6 px-4">
        <div className="text-5xl mb-3">🍳</div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">What Can I Cook?</h1>
        <p className="text-gray-400 mt-1.5 text-sm">Photo your fridge → get recipes → see what to buy</p>
      </header>

      <StepBar step={step} />

      <main className="max-w-xl mx-auto px-4 pb-20">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            {loading ? (
              <Spinner message={loadingMsg} />
            ) : (
              <>
                <div
                  className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer
                    ${isDragging
                      ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                      : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'}
                    ${imagePreview ? 'p-3' : 'p-14 text-center'}`}
                  onClick={() => fileInputRef.current.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                >
                  {imagePreview ? (
                    <div className="text-center">
                      <img
                        src={imagePreview}
                        alt="Fridge preview"
                        className="max-h-64 mx-auto rounded-xl object-contain"
                      />
                      <p className="text-xs text-gray-400 mt-2">Click to change photo</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-5xl mb-4">📸</div>
                      <p className="text-base font-semibold text-gray-600">Drop your fridge photo here</p>
                      <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
                      <p className="text-xs text-gray-300 mt-4">JPG · PNG · WebP · HEIC</p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setFile(e.target.files[0])}
                />

                {imagePreview && (
                  <button
                    onClick={analyzeImage}
                    className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-2xl transition-all text-sm"
                  >
                    Identify Ingredients →
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Ingredients */}
        {step === 'ingredients' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            {loading ? (
              <Spinner message={loadingMsg} />
            ) : (
              <>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-bold text-gray-800">
                    {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} found
                  </h2>
                  <span className="text-xs text-gray-400">Edit if anything looks off</span>
                </div>

                <div className="flex flex-wrap gap-2 min-h-10 mb-5">
                  {ingredients.map((ing, i) => (
                    <IngredientChip
                      key={i}
                      name={ing}
                      onRemove={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))}
                    />
                  ))}
                  {ingredients.length === 0 && (
                    <p className="text-sm text-gray-400">No ingredients — add some below.</p>
                  )}
                </div>

                <form onSubmit={addIngredient} className="flex gap-2 mb-6">
                  <input
                    value={newIngredient}
                    onChange={e => setNewIngredient(e.target.value)}
                    placeholder="Add ingredient…"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </form>

                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 font-medium rounded-2xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    ← Try another photo
                  </button>
                  <button
                    onClick={findRecipes}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-2xl transition-all text-sm"
                  >
                    Find Recipes →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="space-y-5">
            {loading ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <Spinner message={loadingMsg} />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-bold text-gray-800">
                    {recipes.length > 0 ? `Top ${recipes.length} recipes` : 'No recipes found'}
                  </h2>
                  <button
                    onClick={reset}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    ← Start over
                  </button>
                </div>

                {recipes.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
                    <div className="text-4xl mb-3">🤷</div>
                    <p className="text-gray-500 text-sm">No recipes found. Try adding more ingredients.</p>
                    <button
                      onClick={() => setStep('ingredients')}
                      className="mt-5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
                    >
                      Edit Ingredients
                    </button>
                  </div>
                ) : (
                  recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)
                )}

                <ShoppingList recipes={recipes} />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
