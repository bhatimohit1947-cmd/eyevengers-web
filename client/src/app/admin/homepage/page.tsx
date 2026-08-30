"use client";

import React, { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, Edit, Plus, GripHorizontal, Loader2, Save, X, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Section {
  id: string;
  sectionType: string;
  configJson: any;
  order: number;
  isVisible: boolean;
}

export default function HomepageBuilder() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editConfigText, setEditConfigText] = useState("");
  const [offers, setOffers] = useState<any[]>([]);
  const [newSectionType, setNewSectionType] = useState('hero_banner');

  const SECTION_TYPES: Record<string, any> = {
    'hero_banner': { title: "New Banner", ctaLabel: "Shop Now", bannerImageUrl: "" },
    'secondary_banner': { title: "Secondary Banner", ctaLabel: "View Details", bannerImageUrl: "" },
    'CategoryRail': { title: "Categories", tiles: [] },
    'SpecialsGrid': { title: "Special Offers", promos: [] },
    'PosterSlider': { title: "Trending", cards: [] },
    'PromoFeatures': { items: [] },
    'InfoCards': { cards: [] },
    'TrustBanner': { title: "Why Choose Us" },
    'VirtualTryOnBanner': { title: "Try on 3D", ctaUrl: "/virtual-try-on" }
  };

  // Array item management helpers
  const handleAddArrayItem = (arrayKey: string) => {
    try {
      const config = JSON.parse(editConfigText);
      if (!config[arrayKey]) config[arrayKey] = [];
      // Push an empty object template
      config[arrayKey].push({
        title: "New Item",
        imageUrl: "",
        linkedOfferId: "",
        ctaUrl: "/",
        targetUrl: "/"
      });
      setEditConfigText(JSON.stringify(config, null, 2));
    } catch (err) {
      alert("Please ensure the JSON is valid before adding an item.");
    }
  };

  const handleRemoveArrayItem = (arrayKey: string, index: number) => {
    try {
      const config = JSON.parse(editConfigText);
      if (config[arrayKey] && Array.isArray(config[arrayKey])) {
        config[arrayKey].splice(index, 1);
        setEditConfigText(JSON.stringify(config, null, 2));
      }
    } catch (err) {}
  };

  const fetchSections = async () => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/cms/pages/home`);
      const data = await res.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error("Failed to load sections", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
    fetch(`https://eyevengers-web.onrender.com/api/offers`)
      .then(r => r.json())
      .then(data => setOffers(data));
  }, []);

  const toggleVisibility = async (id: string, currentVis: boolean) => {
    try {
      setSections(sections.map(s => s.id === id ? { ...s, isVisible: !currentVis } : s));
      await fetch(`https://eyevengers-web.onrender.com/api/cms/sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !currentVis })
      });
    } catch (err) {
      console.error(err);
      fetchSections();
    }
  };

  const openEditor = (section: Section) => {
    setEditingSection(section);
    setEditConfigText(JSON.stringify(section.configJson, null, 2));
  };

  const saveConfig = async () => {
    if (!editingSection) return;
    try {
      const parsedConfig = JSON.parse(editConfigText);
      setSections(sections.map(s => s.id === editingSection.id ? { ...s, configJson: parsedConfig } : s));
      setEditingSection(null);

      await fetch(`https://eyevengers-web.onrender.com/api/cms/sections/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configJson: parsedConfig })
      });
    } catch (err) {
      alert("Invalid JSON format");
      console.error(err);
    }
  };

  const handleAddSection = async () => {
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/cms/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: 'page_home',
          sectionType: newSectionType,
          configJson: SECTION_TYPES[newSectionType] || { title: "New Section" },
          order: sections.length + 1
        })
      });
      if (res.ok) {
        fetchSections();
      }
    } catch (err) {
      console.error("Failed to add section", err);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    const newSections = Array.from(sections);
    const [reorderedItem] = newSections.splice(sourceIndex, 1);
    newSections.splice(destinationIndex, 0, reorderedItem);

    // Update order values internally to reflect array position
    const updatedSections = newSections.map((sec, index) => ({
      ...sec,
      order: index + 1
    }));

    setSections(updatedSections);

    // Persist new orders to backend
    // Since our backend takes one update at a time, we'll fire them sequentially (or in bulk if we supported it).
    // For this POC, we can just update the one that moved, but technically all items between source and destination shifted.
    // Let's just PUT them all that changed.
    try {
      await Promise.all(
        updatedSections.map(sec => 
          fetch(`https://eyevengers-web.onrender.com/api/cms/sections/${sec.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: sec.order })
          })
        )
      );
    } catch (err) {
      console.error("Failed to reorder backend", err);
      fetchSections(); // Revert on fail
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-brand-navy" size={48} /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Homepage Builder</h2>
          <p className="text-sm text-gray-500 mt-1">Drag and drop sections to instantly reorder your live homepage.</p>
        </div>
        <div className="flex gap-3 items-center">
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            value={newSectionType}
            onChange={(e) => setNewSectionType(e.target.value)}
          >
            {Object.keys(SECTION_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button onClick={handleAddSection} className="bg-brand-navy text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-900 transition shadow-sm">
            <Plus size={18} />
            Add Section
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left: Drag & Drop List */}
        <div className="w-full lg:w-1/2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <GripHorizontal size={18} className="text-gray-400" />
            <h3 className="font-bold text-gray-700">Live Sections</h3>
          </div>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="homepage-sections">
              {(provided) => (
                <div 
                  className="overflow-y-auto p-4 space-y-3 flex-1 bg-gray-50/50"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white border ${section.isVisible ? 'border-gray-200 shadow-sm' : 'border-gray-100 border-dashed opacity-60'} rounded-xl p-4 flex items-center gap-4 transition-all hover:border-blue-300 ${snapshot.isDragging ? 'shadow-xl scale-[1.02] rotate-1 z-50 ring-2 ring-brand-navy' : ''}`}
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-brand-navy p-1"
                          >
                            <GripVertical size={20} />
                          </div>
                          
                          <div className="w-10 h-10 rounded bg-blue-50 text-brand-navy flex items-center justify-center font-bold text-xs shrink-0">
                            {section.order}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {section.sectionType}
                              </span>
                              {!section.isVisible && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                  Hidden
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-900 truncate">
                              {section.configJson?.title || section.configJson?.heading || section.configJson?.sectionTitle || 'Untitled Section'}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 border-l border-gray-100 pl-4 shrink-0">
                            <button 
                              onClick={() => toggleVisibility(section.id, section.isVisible)}
                              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                              {section.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button 
                              onClick={() => openEditor(section)}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Right: Live Configuration Preview */}
        <div className="hidden lg:flex w-1/2 flex-col gap-4 min-h-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex-1 flex flex-col overflow-hidden">
            {editingSection ? (
              <div className="flex flex-col h-full overflow-hidden">
                 <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 flex-shrink-0">
                   <div>
                     <h3 className="font-bold text-gray-900">Edit JSON Configuration</h3>
                     <p className="text-xs text-gray-500 mt-1">Modifying: {editingSection.sectionType}</p>
                   </div>
                   <button onClick={() => setEditingSection(null)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition">
                     <X size={20} />
                   </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                   <textarea 
                     className="w-full h-48 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy"
                     value={editConfigText}
                     onChange={(e) => setEditConfigText(e.target.value)}
                   />

                 {/* Enh 7: Link to Offer Dropdowns */}
                 <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                   <h4 className="font-bold text-blue-900 mb-2">Link to Offer</h4>
                   
                   {/* Top Level Link (Hero Banner, Secondary Banner) */}
                   {['hero_banner', 'secondary_banner'].includes(editingSection.sectionType) && (
                     <div className="mb-3">
                       <label className="text-xs font-bold text-blue-800">Banner Link Destination</label>
                       <select 
                         className="w-full mt-1 border border-blue-200 rounded p-1.5 text-sm"
                         value={(() => { try { return JSON.parse(editConfigText).linkedOfferId || ''; } catch { return ''; } })()}
                         onChange={(e) => {
                           try {
                             const config = JSON.parse(editConfigText);
                             config.linkedOfferId = e.target.value;
                             setEditConfigText(JSON.stringify(config, null, 2));
                           } catch (err) {}
                         }}
                       >
                         <option value="">-- No Offer Link --</option>
                         {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                       </select>
                     </div>
                     )}
                   </div>

                   {/* Top Level Banner Inputs */}
                    {(() => {
                      try {
                        const config = JSON.parse(editConfigText);
                        const hasBannerImg = 'bannerImageUrl' in config;
                        const hasCta = 'ctaUrl' in config || 'targetUrl' in config || ['hero_banner', 'secondary_banner'].includes(editingSection.sectionType);
                        
                        if (hasBannerImg || hasCta) {
                          return (
                            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                              <h4 className="font-bold text-purple-900 mb-2">Banner Settings</h4>
                              
                              {hasBannerImg && (
                                <div className="mb-3">
                                  <label className="text-xs font-bold text-purple-800">Banner Image URL</label>
                                  <input 
                                    type="text"
                                    placeholder="https://..."
                                    className="w-full mt-1 border border-purple-200 rounded p-1.5 text-sm"
                                    value={config.bannerImageUrl || ''}
                                    onChange={(e) => {
                                      try {
                                        const newConfig = JSON.parse(editConfigText);
                                        newConfig.bannerImageUrl = e.target.value;
                                        setEditConfigText(JSON.stringify(newConfig, null, 2));
                                      } catch (err) {}
                                    }}
                                  />
                                </div>
                              )}

                              {hasCta && (
                                <div>
                                  <label className="text-xs font-bold text-purple-800">Target URL / CTA Link</label>
                                  <input 
                                    type="text"
                                    placeholder="e.g., /membership?offerId=..."
                                    className="w-full mt-1 border border-purple-200 rounded p-1.5 text-sm"
                                    value={config.targetUrl || config.ctaUrl || ''}
                                    onChange={(e) => {
                                      try {
                                        const newConfig = JSON.parse(editConfigText);
                                        // Update whichever key was originally used, or default to targetUrl
                                        if ('ctaUrl' in newConfig) {
                                          newConfig.ctaUrl = e.target.value;
                                        } else {
                                          newConfig.targetUrl = e.target.value;
                                        }
                                        setEditConfigText(JSON.stringify(newConfig, null, 2));
                                      } catch (err) {}
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        }
                      } catch(err) {}
                      return null;
                    })()}

                   {/* Array Items Management (Consolidated) */}
                   {(() => {
                     try {
                       const config = JSON.parse(editConfigText);
                       const arrayKey = ['tiles', 'cards', 'slides', 'posters', 'guides', 'items', 'promos'].find(key => Array.isArray(config[key]));
                       
                       if (!arrayKey) return null;

                       const items = config[arrayKey];

                       return (
                         <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                           <div className="flex justify-between items-center mb-3">
                             <h4 className="font-bold text-purple-900 capitalize">{arrayKey} Items ({items.length})</h4>
                             <button 
                               onClick={() => handleAddArrayItem(arrayKey)}
                               className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-purple-700"
                             >
                               <Plus size={14} /> Add New Item
                             </button>
                           </div>
                           
                           <div className="space-y-3">
                             {items.map((item: any, idx: number) => {
                               const imgKey = 'mediaUrl' in item ? 'mediaUrl' : ('videoUrl' in item ? 'videoUrl' : 'imageUrl');
                               return (
                                 <div key={idx} className="flex flex-col bg-white p-3 rounded-lg border border-purple-200 shadow-sm relative group">
                                   <button 
                                     onClick={() => handleRemoveArrayItem(arrayKey, idx)}
                                     className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                                     title="Remove Item"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                   
                                   <label className="text-xs font-bold text-gray-700 mb-1">
                                     {item.label || item.title || item.headline || `Item ${idx+1}`}
                                   </label>
                                   
                                   {/* Image URL */}
                                   <input 
                                     type="text"
                                     placeholder="Image URL (https://...)"
                                     className="w-full mb-2 border border-gray-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-purple-400"
                                     value={item[imgKey] || ''}
                                     onChange={(e) => {
                                       try {
                                         const newConfig = JSON.parse(editConfigText);
                                         newConfig[arrayKey][idx][imgKey] = e.target.value;
                                         setEditConfigText(JSON.stringify(newConfig, null, 2));
                                       } catch (err) {}
                                     }}
                                   />
                                   
                                   {/* Target URL */}
                                   <input 
                                     type="text"
                                     placeholder="Target URL (e.g., /membership?offerId=...)"
                                     className="w-full mb-2 border border-gray-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-purple-400"
                                     value={item.targetUrl || item.ctaUrl || ''}
                                     onChange={(e) => {
                                       try {
                                         const newConfig = JSON.parse(editConfigText);
                                         newConfig[arrayKey][idx].targetUrl = e.target.value;
                                         setEditConfigText(JSON.stringify(newConfig, null, 2));
                                       } catch (err) {}
                                     }}
                                   />
                                   
                                   {/* Link to Offer */}
                                   <select 
                                     className="w-full border border-gray-200 rounded p-1.5 text-xs bg-gray-50 focus:ring-1 focus:ring-purple-400"
                                     value={item.linkedOfferId || ''}
                                     onChange={(e) => {
                                       try {
                                         const newConfig = JSON.parse(editConfigText);
                                         newConfig[arrayKey][idx].linkedOfferId = e.target.value;
                                         setEditConfigText(JSON.stringify(newConfig, null, 2));
                                       } catch (err) {}
                                     }}
                                   >
                                     <option value="">-- No Offer Link (Use standard URL) --</option>
                                     {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                   </select>
                                   
                                   {/* Badge/Ribbon Text */}
                                   <input 
                                     type="text"
                                     placeholder="Badge / Ribbon Text (Optional, e.g. 50% OFF)"
                                     className="w-full mt-2 border border-gray-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-purple-400"
                                     value={item.badgeText || item.ribbonText || ''}
                                     onChange={(e) => {
                                       try {
                                         const newConfig = JSON.parse(editConfigText);
                                         // Support both badgeText and ribbonText
                                         if (['specials_grid', 'poster_slider', 'SpecialsGrid', 'PosterSlider'].includes(editingSection.sectionType) || 'ribbonText' in newConfig[arrayKey][idx]) {
                                           newConfig[arrayKey][idx].ribbonText = e.target.value;
                                         } else {
                                           newConfig[arrayKey][idx].badgeText = e.target.value;
                                         }
                                         setEditConfigText(JSON.stringify(newConfig, null, 2));
                                       } catch (err) {}
                                     }}
                                   />
                                 </div>
                               );
                             })}
                           </div>
                         </div>
                       );
                     } catch (err) {
                       return <p className="text-xs text-red-500 mt-2">Error rendering array items. Please check JSON.</p>;
                     }
                   })()}
                 </div>

                 <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                   <button 
                     onClick={saveConfig}
                     className="bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 transition flex items-center gap-2"
                   >
                     <Save size={18} /> Save Changes
                   </button>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm text-center">
                 <Edit size={32} className="mb-3 opacity-50" />
                 <p>Click the Edit icon on a section to modify its JSON payload.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
