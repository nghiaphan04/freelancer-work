"use client";


export default function AppDownload() {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          
          {/* Left Side - Phone Mockups */}
          <div className="relative flex-1 flex justify-center lg:justify-start">
            {/* Phone mockups container */}
            <div className="relative w-full max-w-lg h-[400px] lg:h-[500px]">
              
              {/* Main Phone */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-[420px] bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-800 overflow-hidden z-20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl"></div>
                <div className="w-full h-full bg-gradient-to-b from-[#00b14f] to-[#009643] p-4 pt-8">
                  <div className="bg-white/20 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-2 bg-white/60 rounded w-20 mb-1"></div>
                        <div className="h-2 bg-white/40 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2 flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-300 rounded w-24 mb-1"></div>
                        <div className="h-2 bg-[#00b14f] rounded w-16"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-300 rounded w-20 mb-1"></div>
                        <div className="h-2 bg-[#00b14f] rounded w-14"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-300 rounded w-28 mb-1"></div>
                        <div className="h-2 bg-[#00b14f] rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Phone - Left */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-40 h-[320px] bg-white rounded-[2rem] shadow-xl border-4 border-gray-700 overflow-hidden z-10 opacity-80 -rotate-6">
                <div className="w-full h-full bg-white p-3">
                  <div className="h-3 bg-[#00b14f] rounded mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-16 bg-gray-100 rounded"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Secondary Phone - Right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-[320px] bg-white rounded-[2rem] shadow-xl border-4 border-gray-700 overflow-hidden z-10 opacity-80 rotate-6">
                <div className="w-full h-full bg-[#1a3a2f] p-3">
                  <div className="text-white text-xs font-bold mb-2">Podcast</div>
                  <div className="bg-[#00b14f] rounded-lg p-2 mb-2">
                    <div className="h-2 bg-white/60 rounded w-16 mb-1"></div>
                    <div className="h-2 bg-white/40 rounded w-12"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 bg-white/10 rounded"></div>
                    <div className="h-12 bg-white/10 rounded"></div>
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00b14f] mb-4 leading-tight">
              Kiến tạo sự nghiệp của riêng bạn với ứng dụng Freelancer
            </h2>
            
            <p className="text-gray-600 text-base mb-2">
              "Tất cả trong một"
            </p>
            
            <p className="text-gray-600 text-base mb-8 max-w-md mx-auto lg:mx-0">
              Trải nghiệm tạo CV, tìm việc, ứng tuyển và hơn thế nữa - chỉ với một ứng dụng duy nhất. Bắt đầu ngay hôm nay!
            </p>

 
          </div>

        </div>
      </div>
    </section>
  );
}
