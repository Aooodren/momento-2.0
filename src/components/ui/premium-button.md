# Premium Buttons - Guide d'utilisation

Ce guide explique quand et comment utiliser les différents composants de boutons premium dans Momento.

## 🎯 Types de boutons disponibles

### 1. `CTAButton` - Bouton d'action principal
**Usage :** Actions principales qui mènent à la création ou à l'accomplissement d'une tâche importante.

**Style :** Fond noir élégant avec effet de brillance au survol.

**Exemples d'utilisation :**
- "Créer un projet"
- "Nouveau bloc" 
- "Créer un bloc"
- "Ajouter une intégration"
- "Inviter des collaborateurs"

```tsx
<CTAButton 
  onClick={handleCreate} 
  icon={<Plus className="h-4 w-4" />}
>
  Créer un projet
</CTAButton>
```

### 2. `NavButton` - Bouton de navigation
**Usage :** Navigation et actions secondaires, généralement de retour ou d'annulation.

**Style :** Bordure noire avec fond blanc, survol avec fond noir.

**Exemples d'utilisation :**
- "Retour"
- "Annuler"
- "Fermer"

```tsx
<NavButton onClick={handleBack} className="gap-2">
  <ArrowLeft className="w-4 h-4" />
  Retour
</NavButton>
```

### 3. `GradientButton` - Bouton gradient attractif
**Usage :** Actions secondaires importantes qui doivent attirer l'attention sans être la première action.

**Style :** Gradient bleu-violet avec effets de survol.

**Exemples d'utilisation :**
- "Voir la démo"
- "Essayer gratuitement"
- "En savoir plus"

```tsx
<GradientButton 
  onClick={handleDemo}
  icon={<Zap className="h-4 w-4" />}
>
  Voir la démo
</GradientButton>
```

### 4. `PremiumButton` - Bouton premium de base
**Usage :** Composant de base pour créer des variations personnalisées.

**Variants :**
- `primary` : Fond noir élégant
- `outline` : Bordure avec fond transparent

```tsx
<PremiumButton 
  variant="primary" 
  size="default"
  icon={<Settings className="h-4 w-4" />}
>
  Paramètres
</PremiumButton>
```

## 🎨 Hiérarchie visuelle recommandée

1. **CTAButton** - Action principale (1 par écran maximum)
2. **GradientButton** - Action secondaire importante
3. **NavButton** - Navigation et actions neutres
4. **Button standard** - Autres actions

## 📱 Tailles disponibles

- `sm` : Boutons compacts pour les barres d'outils
- `default` : Taille standard pour la plupart des cas
- `lg` : Boutons proéminents pour les CTAs importants

## ✨ Fonctionnalités avancées

### Effet de brillance (CTAButton)
- Animation de brillance au survol
- Créé avec des pseudo-éléments CSS

### Micro-interactions
- Effet de scale au clic (`active:scale-[0.98]`)
- Transitions fluides sur tous les états
- Ombres dynamiques

### Accessibilité
- Support clavier complet
- Focus rings visibles
- États disabled appropriés
- ARIA labels supportés

## 🚀 Bonnes pratiques

1. **Ne pas abuser des boutons premium** - Utilisez-les pour les actions vraiment importantes
2. **Cohérence** - Utilisez le même type de bouton pour les actions similaires
3. **Contraste** - Assurez-vous que le texte reste lisible
4. **Mobile-friendly** - Tous les boutons sont responsive

## 🎯 Mapping avec l'ancien système

| Ancien bouton | Nouveau bouton | Raison |
|---------------|----------------|---------|
| `Button primary` pour créations | `CTAButton` | Plus impactant |
| `Button ghost` pour navigation | `NavButton` | Plus élégant |
| `Button outline` pour démos | `GradientButton` | Plus attractif |

---

Cette approche garantit une expérience utilisateur cohérente et professionnelle à travers toute l'application Momento.