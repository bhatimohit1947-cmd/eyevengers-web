import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';

// GET all pages
export const getPages = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('cms_pages').select('*');
    if (error) throw error;
    
    // Map snake_case to camelCase
    const formattedData = (data || []).map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
    
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

// GET single page with its sections
export const getPageWithSections = async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  try {
    const { data: pageData, error: pageError } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (pageError || !pageData) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('cms_sections')
      .select('*')
      .eq('page_id', pageData.id)
      .order('order_index', { ascending: true });
      
    if (sectionsError) throw sectionsError;
    
    const formattedPage = {
      id: pageData.id,
      slug: pageData.slug,
      title: pageData.title,
      status: pageData.status,
      createdAt: pageData.created_at,
      updatedAt: pageData.updated_at
    };
    
    const formattedSections = (sectionsData || []).map(s => {
      let parsedConfig = {};
      try {
        parsedConfig = typeof s.config_json === 'string' ? JSON.parse(s.config_json) : s.config_json;
      } catch (e) {}
      
      return {
        id: s.id,
        pageId: s.page_id,
        sectionType: s.section_type,
        order: s.order_index,
        isVisible: s.is_visible,
        configJson: parsedConfig
      };
    });
    
    res.json({ ...formattedPage, sections: formattedSections });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page with sections' });
  }
};

// PUT update section config
export const updateSection = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { configJson, isVisible, order } = req.body;

  try {
    const updates: any = {};
    if (configJson !== undefined) updates.config_json = configJson;
    if (isVisible !== undefined) updates.is_visible = isVisible;
    if (order !== undefined) updates.order_index = order;
    
    const { data, error } = await supabase
      .from('cms_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    let parsedConfig = {};
    try {
      parsedConfig = typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json;
    } catch (e) {}

    res.json({
      id: data.id,
      pageId: data.page_id,
      sectionType: data.section_type,
      order: data.order_index,
      isVisible: data.is_visible,
      configJson: parsedConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section' });
  }
};

// POST add new section
export const createSection = async (req: Request, res: Response) => {
  const { pageId, sectionType, configJson, order } = req.body;

  try {
    const newRecord = {
      id: `sec_${Date.now()}`,
      page_id: pageId,
      section_type: sectionType,
      config_json: configJson || {},
      order_index: order || 99,
      is_visible: true
    };
    
    const { data, error } = await supabase
      .from('cms_sections')
      .insert([newRecord])
      .select()
      .single();
      
    if (error) throw error;
    
    let parsedConfig = {};
    try {
      parsedConfig = typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json;
    } catch (e) {}

    res.status(201).json({
      id: data.id,
      pageId: data.page_id,
      sectionType: data.section_type,
      order: data.order_index,
      isVisible: data.is_visible,
      configJson: parsedConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create section' });
  }
};

// DELETE section
export const deleteSection = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const { error } = await supabase
      .from('cms_sections')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
};
