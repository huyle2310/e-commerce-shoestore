'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { useLanguageStore } from '@/store/languageStore';

export default function AboutPage() {
  const { settings, fetchSettings } = useSiteSettingsStore();
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  if (!mounted) return null;

  const title = language === 'vi' ? settings?.aboutTitleVi : settings?.aboutTitleEn;
  const slogan = language === 'vi' ? settings?.aboutSloganVi : settings?.aboutSloganEn;
  const content = language === 'vi' ? settings?.aboutContentVi : settings?.aboutContentEn;

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center bg-black overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-50 mix-blend-luminosity"
        ></motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 uppercase"
          >
            {title || (language === 'vi' ? 'VỀ VANGUARD' : 'ABOUT VANGUARD')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-neutral-300 font-light"
          >
            {slogan || (language === 'vi' ? 'Định hình phong cách. Khẳng định chất riêng.' : 'Shape your style. Assert your ego.')}
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-neutral-900 leading-tight mb-12 uppercase tracking-tight"
          >
            "{slogan || (language === 'vi' ? 'Chúng tôi tin rằng đôi giày không chỉ để đi, mà là tuyên ngôn của người mang nó.' : 'We believe shoes are not just for walking, but a statement of the wearer.')}"
          </motion.p>
          <div className="h-1.5 w-24 bg-orange-500 mx-auto mb-12 rounded-full"></div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl text-neutral-500 leading-relaxed max-w-3xl mx-auto whitespace-pre-line"
          >
            {content || (language === 'vi' ? 'Ra đời từ đam mê cháy bỏng với văn hóa sát mặt đất, Vanguard khởi đầu với một sứ mệnh duy nhất: Mang đến cho giới trẻ Việt Nam những đôi giày thể thao đỉnh cao nhất, với chất lượng dịch vụ tiệm cận sự hoàn hảo. Hơn cả một cửa hàng, chúng tôi là một cộng đồng.' : 'Born from a burning passion for sneaker culture, Vanguard started with a single mission: To bring Vietnamese youth the top sports shoes, with service quality approaching perfection. More than a store, we are a community.')}
          </motion.div>
        </div>
      </section>
      
      {/* Core Values */}
      <section className="bg-neutral-950 text-white py-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
              {language === 'vi' ? 'Giá trị cốt lõi' : 'Core Values'}
            </h2>
            <p className="text-neutral-400 text-lg">
              {language === 'vi' ? 'Những nguyên tắc định hình con đường của Vanguard.' : 'The principles that shape Vanguard\'s path.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <div className="w-24 h-24 mx-auto bg-neutral-900 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-orange-500 transition-all duration-300">
                <span className="text-4xl font-black">01</span>
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-wider">AUTHENTICITY</h3>
              <p className="text-neutral-400 leading-relaxed">
                {language === 'vi' ? 'Cam kết 100% sản phẩm chính hãng. Không nhượng bộ, không thỏa hiệp với hàng giả. Chất lượng thật, giá trị thật.' : 'Commitment to 100% authentic products. No concessions, no compromises with fakes. Real quality, real value.'}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <div className="w-24 h-24 mx-auto bg-neutral-900 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-orange-500 transition-all duration-300">
                <span className="text-4xl font-black">02</span>
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-wider">INNOVATION</h3>
              <p className="text-neutral-400 leading-relaxed">
                {language === 'vi' ? 'Luôn cập nhật những xu hướng và công nghệ mới nhất. Mang đến trải nghiệm mua sắm hiện đại và đẳng cấp bậc nhất.' : 'Always updating the latest trends and technologies. Bringing the most modern and classy shopping experience.'}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <div className="w-24 h-24 mx-auto bg-neutral-900 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-orange-500 transition-all duration-300">
                <span className="text-4xl font-black">03</span>
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-wider">COMMUNITY</h3>
              <p className="text-neutral-400 leading-relaxed">
                {language === 'vi' ? 'Kết nối những tâm hồn đồng điệu. Kiến tạo một sân chơi lành mạnh cho cộng đồng yêu Sneaker tại Việt Nam.' : 'Connecting kindred spirits. Creating a healthy playground for the Sneaker community in Vietnam.'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
