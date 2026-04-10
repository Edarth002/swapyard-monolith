// components/buyer/ValuePropsSection.tsx
import { Leaf, ShieldCheck, Truck } from "lucide-react";

export default function ValuePropsSection() {
  return (
    <div className="bg-gray-50 rounded-2xl p-8 mt-16 mb-8 border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Prop 1 */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Secure Escrow</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your payments are held securely until you confirm receipt. Total peace of mind for every transaction.
            </p>
          </div>
        </div>

        {/* Prop 2 */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Delivery Partners</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              We've partnered with top logistics providers to offer discounted shipping on bulky items.
            </p>
          </div>
        </div>

        {/* Prop 3 */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Eco-Friendly</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Extend the lifecycle of home goods. Buying secondhand reduces waste and helps the planet.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}