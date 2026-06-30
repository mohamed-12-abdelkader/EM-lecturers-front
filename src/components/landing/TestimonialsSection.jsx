import React from "react";
import Marquee from "react-fast-marquee";

const testimonials = [
  {
    id: 1,
    name: "أحمد علي",
    feedback: "الخدمة كانت ممتازة وفريق العمل متعاون جدًا. أنصح بالتعامل معهم!",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: 2,
    name: "سارة محمد",
    feedback: "أنجزوا مشروعي في الوقت المحدد وباحترافية عالية. تجربة رائعة.",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: 3,
    name: "خالد يوسف",
    feedback: "أفضل فريق تعاملت معه، كانوا واضحين ومبدعين في كل خطوة.",
    avatar: "https://i.pravatar.cc/150?img=8",
  },
  {
    id: 4,
    name: "منى عبد الله",
    feedback: "خدمة ممتازة وأسعار مناسبة. أشكرهم جدًا.",
    avatar: "https://i.pravatar.cc/150?img=10",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-gray-100 py-16 px-4" dir="ltr">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">آراء العملاء</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          ماذا قال عملاؤنا عن خدماتنا؟ نعتز بثقتهم ونفخر بتجاربهم الإيجابية.
        </p>
      </div>

      <Marquee
        direction="right"
        speed={100}
        pauseOnHover
        gradient={false}
        className=" mx-auto"
      >
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center mx-4 w-72"
          >
            <img
              src={item.avatar}
              alt={item.name}
              className="w-20 h-20 rounded-full mb-4 object-cover"
            />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
            <p className="text-gray-600 text-sm">{item.feedback}</p>
          </div>
        ))}
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center mx-4 w-72"
          >
            <img
              src={item.avatar}
              alt={item.name}
              className="w-20 h-20 rounded-full mb-4 object-cover"
            />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
            <p className="text-gray-600 text-sm">{item.feedback}</p>
          </div>
        ))}
      </Marquee>
    </section>
  );
};

export default TestimonialsSection;
