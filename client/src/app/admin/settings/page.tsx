import { fetchWithAuth } from '@/utils/fetchWithAuth';
              className="px-6 py-2.5 bg-brand-navy text-white rounded-lg hover:bg-blue-900 font-medium shadow-sm flex items-center gap-2 transition disabled:opacity-70"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
