import useTranslation from "next-translate/useTranslation";
import PageSeo from "@/components/utils/PageSeo";
import {
  LanguageSwitcher,
  LanguageToggle,
} from "@/components/utils/language-switcher";

export default function Home() {
  const { t } = useTranslation("home");
  const { t: common } = useTranslation("common");
  // Example page-specific SEO overrides
  const pageTitle = t("hero_title");
  const pageDescription = t("hero_subtitle");

  return (
    <div className="min-h-screen bg-white">
      <PageSeo
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/"
      />
   

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">
            {t("hero_title")}
          </h1>
          <p className="text-xl text-gray-600 mb-4">{t("hero_subtitle")}</p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            {t("hero_description")}
          </p>
          <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300">
            {t("get_started")}
          </button>
        </div>

        {/* Features Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            {t("features_title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {t("feature_1")}
              </h3>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {t("feature_2")}
              </h3>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {t("feature_3")}
              </h3>
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="mt-16 p-6 bg-yellow-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            {common("welcome")} - Translation Test
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <p>
                <strong>{common("hello")}:</strong> {common("hello")}
              </p>
              <p>
                <strong>{common("language")}:</strong> {common("language")}
              </p>
              <p>
                <strong>{common("home")}:</strong> {common("home")}
              </p>
            </div>

            {/* Dropdown Language Switcher Example */}
            <div className="pt-4 border-t border-yellow-200">
              <p className="mb-2 font-medium">Dropdown Language Switcher:</p>
              <LanguageSwitcher variant="single" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
