import BackButton from "../components/BackButton";

const PrivacyPolicy = () => {
  return (
    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="min-h-screen max-w-4xl w-full text-center mx-auto p-4">
        <div>
          <BackButton />
        </div>
        <h1 className="text-2xl font-bold mb-4">Datenschutz</h1>
        <p className="mb-2">
          Der Schutz Ihrer persönlichen Daten ist uns wichtig. In dieser
          Datenschutzerklärung informieren wir Sie über die Erhebung, Verarbeitung
          und Nutzung Ihrer Daten im Rahmen der Nutzung unserer Website.
        </p>
        <p className="mb-2">
          Wir erheben und verwenden Ihre personenbezogenen Daten nur, soweit dies
          für die Bereitstellung unserer Dienste erforderlich ist. Ihre Daten werden
          vertraulich behandelt und nicht an Dritte weitergegeben, es sei denn, dies
          ist gesetzlich vorgeschrieben oder Sie haben ausdrücklich eingewilligt.
        </p>
        <p className="mb-2">
          Weitere Informationen zu unseren Datenschutzpraktiken finden Sie in unserer
          vollständigen Datenschutzerklärung auf unserer Website.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;