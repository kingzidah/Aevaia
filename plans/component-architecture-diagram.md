# Component Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph "HeartCraft Studio Application"
        Studio[Studio Page]
        
        subgraph "Left Panel - Design Controls"
            LeftPanel[Left Panel Container]
            TEP[TextEditorPanel]
            ThemeSelector[Theme Selector]
        end
        
        subgraph "Center Panel - Canvas"
            CenterPanel[Center Panel Container]
            PhoneMockup[Phone Mockup]
            HeadlineEditor[Headline Tiptap Editor]
            ParagraphEditor[Paragraph Tiptap Editor]
            ImageArea[Image Area]
        end
        
        subgraph "Right Panel - AI Council"
            RightPanel[Right Panel Container]
            AICouncil[AI Council]
        end
        
        Studio --> LeftPanel
        Studio --> CenterPanel
        Studio --> RightPanel
        
        LeftPanel --> TEP
        LeftPanel --> ThemeSelector
        
        CenterPanel --> PhoneMockup
        PhoneMockup --> HeadlineEditor
        PhoneMockup --> ParagraphEditor
        PhoneMockup --> ImageArea
    end
```

---

## TextEditorPanel Component Tree

```mermaid
graph TB
    TEP[TextEditorPanel]
    
    subgraph "Font Controls"
        FFS[FontFamilySelector]
        FSC[FontSizeControl]
    end
    
    subgraph "Text Styling"
        TST[TextStyleToolbar]
        Bold[Bold Button]
        Italic[Italic Button]
        Underline[Underline Button]
        Strike[Strikethrough Button]
    end
    
    subgraph "Alignment"
        AT[AlignmentToolbar]
        AlignLeft[Left Button]
        AlignCenter[Center Button]
        AlignRight[Right Button]
        Justify[Justify Button]
    end
    
    subgraph "Colors"
        CP[ColorPalette]
        CS1[ColorSwatch Row 1]
        CS2[ColorSwatch Row 2]
        CS3[ColorSwatch Row 3]
        CS4[ColorSwatch Row 4]
        CustomColors[Custom Color Slots]
        CPM[ColorPickerModal]
    end
    
    subgraph "Background"
        BCP[BackgroundColorPicker]
        BGPalette[Background Palette]
    end
    
    subgraph "Lists"
        LC[ListControls]
        TaskList[Task List Button]
        BulletList[Bullet List Button]
        OrderedList[Ordered List Button]
    end
    
    TEP --> FFS
    TEP --> FSC
    TEP --> TST
    TEP --> AT
    TEP --> CP
    TEP --> BCP
    TEP --> LC
    
    TST --> Bold
    TST --> Italic
    TST --> Underline
    TST --> Strike
    
    AT --> AlignLeft
    AT --> AlignCenter
    AT --> AlignRight
    AT --> Justify
    
    CP --> CS1
    CP --> CS2
    CP --> CS3
    CP --> CS4
    CP --> CustomColors
    CP --> CPM
    
    BCP --> BGPalette
    
    LC --> TaskList
    LC --> BulletList
    LC --> OrderedList
```

---

## State Flow Diagram

```mermaid
graph LR
    subgraph "User Interaction"
        User[User Action]
    end
    
    subgraph "Component Layer"
        Button[UI Button/Control]
        TEP[TextEditorPanel]
    end
    
    subgraph "Editor Layer"
        TiptapEditor[Tiptap Editor Instance]
        Commands[Tiptap Commands]
    end
    
    subgraph "Persistence Layer"
        LocalStorage[LocalStorage]
        Supabase[Supabase Database]
    end
    
    subgraph "Rendering Layer"
        EditorContent[EditorContent Component]
        DOM[DOM Output]
    end
    
    User -->|Click/Type| Button
    Button -->|Trigger| TEP
    TEP -->|Execute| Commands
    Commands -->|Update| TiptapEditor
    TiptapEditor -->|Auto-save| LocalStorage
    TiptapEditor -->|Publish| Supabase
    TiptapEditor -->|Render| EditorContent
    EditorContent -->|Display| DOM
    
    LocalStorage -.->|Load on mount| TiptapEditor
    Supabase -.->|Load saved gift| TiptapEditor
```

---

## Data Flow: Text Formatting

```mermaid
sequenceDiagram
    participant User
    participant BoldButton
    participant TextEditorPanel
    participant TiptapEditor
    participant EditorContent
    participant LocalStorage
    
    User->>BoldButton: Click Bold
    BoldButton->>TiptapEditor: editor.chain().focus().toggleBold().run()
    TiptapEditor->>TiptapEditor: Update internal state
    TiptapEditor->>EditorContent: Trigger re-render
    EditorContent->>User: Display bold text
    TiptapEditor->>LocalStorage: Auto-save (debounced)
    LocalStorage-->>TiptapEditor: Confirm saved
```

---

## Data Flow: Color Selection

```mermaid
sequenceDiagram
    participant User
    participant ColorSwatch
    participant ColorPalette
    participant TiptapEditor
    participant EditorContent
    
    User->>ColorSwatch: Click color (#FF5F5F)
    ColorSwatch->>ColorPalette: onClick handler
    ColorPalette->>TiptapEditor: editor.chain().focus().setColor('#FF5F5F').run()
    TiptapEditor->>TiptapEditor: Apply color to selection
    TiptapEditor->>EditorContent: Update DOM
    EditorContent->>User: Display colored text
```

---

## Component File Structure

```
app/
├── studio/
│   └── page.tsx                          # Main studio page (enhanced)
├── gift/
│   └── [id]/
│       └── page.tsx                      # Gift display page (enhanced)
└── globals.css                           # Global styles + Tiptap styles

components/
└── text-editor/
    ├── TextEditorPanel.tsx               # Main panel orchestrator
    ├── FontFamilySelector.tsx            # Font dropdown
    ├── FontSizeControl.tsx               # Size control with +/-
    ├── TextStyleToolbar.tsx              # B, I, U, S buttons
    ├── AlignmentToolbar.tsx              # Alignment buttons
    ├── ColorPalette.tsx                  # Color grid
    ├── ColorSwatch.tsx                   # Individual color button
    ├── BackgroundColorPicker.tsx         # Highlight color picker
    ├── ListControls.tsx                  # List formatting buttons
    ├── ColorPickerModal.tsx              # Advanced color picker
    ├── types.ts                          # TypeScript interfaces
    ├── constants.ts                      # Colors, fonts, sizes
    ├── extensions/
    │   └── FontSize.ts                   # Custom Tiptap extension
    ├── hooks/
    │   ├── useTextEditor.ts              # Editor initialization hook
    │   └── useColorPicker.ts             # Color picker logic
    └── styles.css                        # Component-specific styles

lib/
└── supabase.ts                           # Supabase client (existing)
```

---

## Tiptap Extension Architecture

```mermaid
graph TB
    subgraph "Tiptap Core"
        Editor[Editor Instance]
    end
    
    subgraph "Built-in Extensions"
        StarterKit[StarterKit]
        TextStyle[TextStyle]
        Color[Color]
        Highlight[Highlight]
        TextAlign[TextAlign]
        FontFamily[FontFamily]
        Underline[Underline]
        TaskList[TaskList]
        TaskItem[TaskItem]
    end
    
    subgraph "Custom Extensions"
        FontSize[FontSize Extension]
    end
    
    subgraph "Commands API"
        Commands[Commands]
        SetBold[setBold]
        SetColor[setColor]
        SetFontSize[setFontSize]
        SetAlign[setTextAlign]
    end
    
    Editor --> StarterKit
    Editor --> TextStyle
    Editor --> Color
    Editor --> Highlight
    Editor --> TextAlign
    Editor --> FontFamily
    Editor --> Underline
    Editor --> TaskList
    Editor --> TaskItem
    Editor --> FontSize
    
    Editor --> Commands
    Commands --> SetBold
    Commands --> SetColor
    Commands --> SetFontSize
    Commands --> SetAlign
```

---

## State Management Pattern

```mermaid
graph TB
    subgraph "React State"
        SelectedItem[selectedItem: 'headline' | 'paragraph' | 'image' | 'none']
        HeadlineEditor[headlineEditor: Editor | null]
        ParagraphEditor[paragraphEditor: Editor | null]
        Theme[theme: string]
    end
    
    subgraph "Tiptap Internal State"
        EditorState[Editor State]
        Selection[Text Selection]
        Marks[Active Marks]
        Attributes[Node Attributes]
    end
    
    subgraph "Derived State"
        IsBold[isBold: boolean]
        CurrentColor[currentColor: string]
        CurrentFont[currentFont: string]
        CurrentSize[currentSize: number]
    end
    
    SelectedItem -->|Determines active editor| HeadlineEditor
    SelectedItem -->|Determines active editor| ParagraphEditor
    
    HeadlineEditor --> EditorState
    ParagraphEditor --> EditorState
    
    EditorState --> Selection
    EditorState --> Marks
    EditorState --> Attributes
    
    Marks --> IsBold
    Attributes --> CurrentColor
    Attributes --> CurrentFont
    Attributes --> CurrentSize
```

---

## Integration Points with Existing HeartCraft

```mermaid
graph TB
    subgraph "Existing HeartCraft Features"
        ThemeSystem[Theme System]
        AIRewrite[AI Text Rewrite]
        ImageGen[AI Image Generation]
        PublishFlow[Publish to Supabase]
        ShareModal[Share Modal]
    end
    
    subgraph "New Text Editor Features"
        TiptapEditors[Tiptap Editors]
        TextFormatting[Text Formatting]
        ColorSystem[Color System]
    end
    
    subgraph "Enhanced Features"
        EnhancedPublish[Enhanced Publish]
        EnhancedDisplay[Enhanced Gift Display]
        EnhancedAutoSave[Enhanced Auto-save]
    end
    
    ThemeSystem -.->|Applies to| TiptapEditors
    AIRewrite -->|Updates| TiptapEditors
    TiptapEditors -->|Provides content| EnhancedPublish
    EnhancedPublish --> PublishFlow
    PublishFlow --> ShareModal
    
    TiptapEditors --> TextFormatting
    TiptapEditors --> ColorSystem
    TiptapEditors --> EnhancedAutoSave
    EnhancedPublish --> EnhancedDisplay
```

---

## Rendering Pipeline

```mermaid
graph LR
    subgraph "Input"
        UserTyping[User Typing]
        FormatButton[Format Button Click]
    end
    
    subgraph "Processing"
        TiptapCore[Tiptap Core]
        ProseMirror[ProseMirror Engine]
        Schema[Document Schema]
    end
    
    subgraph "Output"
        JSON[JSON Structure]
        HTML[HTML Output]
        React[React Component]
    end
    
    subgraph "Display"
        EditorContent[EditorContent]
        Browser[Browser DOM]
    end
    
    UserTyping --> TiptapCore
    FormatButton --> TiptapCore
    TiptapCore --> ProseMirror
    ProseMirror --> Schema
    Schema --> JSON
    Schema --> HTML
    JSON --> React
    HTML --> React
    React --> EditorContent
    EditorContent --> Browser
```

---

## Persistence Strategy

```mermaid
graph TB
    subgraph "Editor Changes"
        UserEdit[User Edits Text]
        FormatChange[Format Change]
    end
    
    subgraph "Auto-save Layer"
        Debounce[Debounce 1s]
        LocalStorage[LocalStorage]
    end
    
    subgraph "Manual Save Layer"
        PublishButton[Publish Button]
        Validation[Validate Content]
        Supabase[Supabase Database]
    end
    
    subgraph "Data Formats"
        PlainText[Plain Text]
        HTML[HTML]
        JSON[JSON]
    end
    
    UserEdit --> Debounce
    FormatChange --> Debounce
    Debounce --> LocalStorage
    
    PublishButton --> Validation
    Validation --> PlainText
    Validation --> HTML
    Validation --> JSON
    
    PlainText --> Supabase
    HTML --> Supabase
    JSON --> Supabase
    
    LocalStorage -.->|Restore on reload| UserEdit
```

---

## Event Flow: Complete Formatting Action

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Component
    participant Panel as TextEditorPanel
    participant Editor as Tiptap Editor
    participant Storage as LocalStorage
    participant Display as EditorContent
    
    User->>UI: Click "Bold" button
    UI->>Panel: Handle click event
    Panel->>Editor: editor.chain().focus().toggleBold().run()
    Editor->>Editor: Update document state
    Editor->>Display: Trigger re-render
    Display->>User: Show bold text
    
    Note over Editor,Storage: Debounced auto-save (1s delay)
    
    Editor->>Storage: Save HTML & JSON
    Storage-->>Editor: Confirm saved
    
    Note over User,Display: User continues editing
```

---

## Responsive Layout Strategy

```mermaid
graph TB
    subgraph "Desktop Layout 1920px+"
        LeftD[Left Panel: 380px]
        CenterD[Center Panel: Flex-1]
        RightD[Right Panel: 320px]
    end
    
    subgraph "Tablet Layout 768px-1920px"
        LeftT[Left Panel: 320px]
        CenterT[Center Panel: Flex-1]
        RightT[Right Panel: Collapsible]
    end
    
    subgraph "Mobile Layout <768px"
        TopM[Top Toolbar: Fixed]
        CenterM[Center Panel: Full Width]
        BottomM[Bottom Drawer: Slide-up]
    end
    
    LeftD -.->|Resize| LeftT
    RightD -.->|Collapse| RightT
    LeftT -.->|Transform| TopM
    RightT -.->|Transform| BottomM
```

---

## Error Handling Flow

```mermaid
graph TB
    subgraph "User Actions"
        Action[User Action]
    end
    
    subgraph "Validation Layer"
        Validate[Validate Input]
        CheckLimits[Check Limits]
    end
    
    subgraph "Error Handling"
        Error{Error?}
        ShowToast[Show Toast Message]
        LogError[Log to Console]
        Rollback[Rollback State]
    end
    
    subgraph "Success Path"
        Execute[Execute Command]
        UpdateUI[Update UI]
        SaveState[Save State]
    end
    
    Action --> Validate
    Validate --> CheckLimits
    CheckLimits --> Error
    
    Error -->|Yes| ShowToast
    ShowToast --> LogError
    LogError --> Rollback
    
    Error -->|No| Execute
    Execute --> UpdateUI
    UpdateUI --> SaveState
```

---

## Performance Optimization Strategy

```mermaid
graph TB
    subgraph "Optimization Techniques"
        Memo[React.memo Components]
        Debounce[Debounced Auto-save]
        LazyLoad[Lazy Load Modals]
        VirtualScroll[Virtual Scrolling]
    end
    
    subgraph "Monitoring"
        Metrics[Performance Metrics]
        RenderTime[Render Time]
        MemoryUsage[Memory Usage]
    end
    
    subgraph "Targets"
        Target1[< 100ms Input Response]
        Target2[< 500ms Save Operation]
        Target3[< 50ms Re-render]
    end
    
    Memo --> RenderTime
    Debounce --> Metrics
    LazyLoad --> MemoryUsage
    
    RenderTime --> Target3
    Metrics --> Target2
    RenderTime --> Target1
```

---

## Testing Architecture

```mermaid
graph TB
    subgraph "Unit Tests"
        ComponentTests[Component Tests]
        HookTests[Hook Tests]
        UtilTests[Utility Tests]
    end
    
    subgraph "Integration Tests"
        EditorIntegration[Editor Integration]
        StateManagement[State Management]
        APIIntegration[API Integration]
    end
    
    subgraph "E2E Tests"
        UserFlows[User Flows]
        PublishFlow[Publish Flow]
        LoadFlow[Load Flow]
    end
    
    subgraph "Visual Tests"
        SnapshotTests[Snapshot Tests]
        VisualRegression[Visual Regression]
    end
    
    ComponentTests --> EditorIntegration
    HookTests --> StateManagement
    EditorIntegration --> UserFlows
    StateManagement --> PublishFlow
    APIIntegration --> LoadFlow
    
    ComponentTests --> SnapshotTests
    EditorIntegration --> VisualRegression
```

---

## Deployment Pipeline

```mermaid
graph LR
    subgraph "Development"
        Dev[Local Development]
        UnitTest[Run Unit Tests]
    end
    
    subgraph "CI/CD"
        Build[Build Application]
        IntegrationTest[Integration Tests]
        E2ETest[E2E Tests]
    end
    
    subgraph "Staging"
        StagingDeploy[Deploy to Staging]
        QA[QA Testing]
    end
    
    subgraph "Production"
        ProdDeploy[Deploy to Production]
        Monitor[Monitor Performance]
    end
    
    Dev --> UnitTest
    UnitTest --> Build
    Build --> IntegrationTest
    IntegrationTest --> E2ETest
    E2ETest --> StagingDeploy
    StagingDeploy --> QA
    QA --> ProdDeploy
    ProdDeploy --> Monitor
    Monitor -.->|Issues| Dev
```

---

## Summary

This architecture provides:

1. **Clear Separation of Concerns**: UI components, business logic, and data persistence are separated
2. **Scalability**: Easy to add new formatting features or tools
3. **Maintainability**: Well-organized component structure with clear responsibilities
4. **Performance**: Optimized with memoization, debouncing, and lazy loading
5. **Testability**: Each layer can be tested independently
6. **Integration**: Seamlessly integrates with existing HeartCraft features

The architecture follows React and Tiptap best practices while maintaining the Samsung Notes UI/UX standards.
