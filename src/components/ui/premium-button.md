# Simple Buttons - Guide d'utilisation

Ce guide explique quand utiliser les boutons simples améliorés dans Momento.

## 🎯 Types de boutons disponibles

### 1. `CTAButton` - Bouton d'action principal
**Usage :** Actions principales qui mènent à la création ou à l'accomplissement d'une tâche importante.

**Style :** Fond noir simple et élégant (`bg-gray-900`).

**Exemples d'utilisation :**
- "Créer un projet"
- "Nouveau bloc" 
- "Créer un bloc"
- "Ajouter une intégration"
- "Inviter des collaborateurs"

```tsx
<CTAButton onClick={handleCreate} className="gap-2">
  <Plus className="h-4 w-4" />
  Créer un projet
</CTAButton>
```

### 2. `SimpleButton` - Bouton de base flexible
**Usage :** Bouton de base avec des variants simples.

**Variants :**
- `primary` : Fond noir (`bg-gray-900`)
- `outline` : Bordure noire avec fond blanc
- `ghost` : Fond transparent avec hover gris léger

**Exemples d'utilisation :**

```tsx
{/* Bouton principal noir */}
<SimpleButton variant="primary">Action importante</SimpleButton>

{/* Bouton de navigation */}
<SimpleButton variant="outline" size="sm" className="gap-2">
  <ArrowLeft className="w-4 h-4" />
  Retour
</SimpleButton>

{/* Bouton secondaire */}
<SimpleButton variant="ghost">Action secondaire</SimpleButton>
```

## 🎨 Hiérarchie visuelle

1. **CTAButton** - Action principale (fond noir)
2. **Button standard** - Actions secondaires 
3. **SimpleButton outline** - Navigation et actions neutres

## 📱 Tailles disponibles

- `sm` : Boutons compacts (`h-9`)
- `default` : Taille standard (`h-10`) 
- `lg` : Boutons proéminents (`h-11`)

## 🚀 Principe de design

**Simplicité avant tout :** Ces boutons suivent la philosophie de design existante de l'app :
- Pas d'animations excessives
- Pas de gradients ou d'effets complexes
- Juste un fond noir simple pour les actions importantes
- Cohérence avec le système existant

## 🎯 Utilisation recommandée

### ✅ Utiliser CTAButton pour :
- "Nouveau projet"
- "Créer un bloc" 
- "Ajouter une intégration"
- Toute action de création principale

### ✅ Utiliser SimpleButton outline pour :
- Boutons "Retour"
- Navigation secondaire
- Actions d'annulation

### ✅ Utiliser Button standard pour :
- "Voir la démo"
- Actions secondaires
- Boutons dans les formulaires

---

Cette approche maintient la simplicité et la cohérence du design existant tout en améliorant la visibilité des actions importantes.