import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">Last Updated: March 18, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using GameLab, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily access the materials on GameLab's website for personal, non-commercial use. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li className="mb-2">Modify or copy the materials</li>
                <li className="mb-2">Use the materials for any commercial purpose or for any public display</li>
                <li className="mb-2">Attempt to decompile or reverse engineer any software contained on GameLab</li>
                <li className="mb-2">Remove any copyright or other proprietary notations from the materials</li>
                <li className="mb-2">Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
              <p>
                This license shall automatically terminate if you violate any of these restrictions and may be terminated by GameLab 
                at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must 
                destroy any downloaded materials in your possession whether in electronic or printed format.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p>
                To access certain features of the platform, you may be required to create an account. You are responsible for 
                maintaining the confidentiality of your account information and for all activities that occur under your account. 
                You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
              <p>
                By uploading games, descriptions, comments, or other content to GameLab, you grant us a worldwide, non-exclusive, 
                royalty-free license to use, reproduce, adapt, publish, translate, and distribute your content in any existing 
                or future media formats. You represent and warrant that you own or control all rights to the content you post 
                and that use of your content does not violate the rights of any third party.
              </p>
              <p>
                You are solely responsible for any content you post, upload, or otherwise make available via the platform. Content 
                that is illegal, offensive, threatening, libelous, defamatory, pornographic, obscene, or otherwise objectionable 
                is strictly prohibited.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Game Claiming Process</h2>
              <p>
                GameLab allows game developers to claim their games by verifying their identity through X (Twitter). By claiming 
                a game, you represent and warrant that you are the rightful owner or authorized representative of the game. 
                Falsely claiming ownership of a game you did not create is strictly prohibited and may result in termination 
                of your account.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Disclaimer</h2>
              <p>
                The materials on GameLab's website are provided on an 'as is' basis. GameLab makes no warranties, expressed or 
                implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties 
                or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property 
                or other violation of rights.
              </p>
              <p>
                Further, GameLab does not warrant or make any representations concerning the accuracy, likely results, or 
                reliability of the use of the materials on its website or otherwise relating to such materials or on any sites 
                linked to this site.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitations</h2>
              <p>
                In no event shall GameLab or its suppliers be liable for any damages (including, without limitation, damages for 
                loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials 
                on GameLab's website, even if GameLab or a GameLab authorized representative has been notified orally or in writing 
                of the possibility of such damage.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Revisions and Errata</h2>
              <p>
                The materials appearing on GameLab's website could include technical, typographical, or photographic errors. 
                GameLab does not warrant that any of the materials on its website are accurate, complete, or current. GameLab may 
                make changes to the materials contained on its website at any time without notice.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Links</h2>
              <p>
                GameLab has not reviewed all of the sites linked to its website and is not responsible for the contents of any 
                such linked site. The inclusion of any link does not imply endorsement by GameLab of the site. Use of any such 
                linked website is at the user's own risk.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Modifications</h2>
              <p>
                GameLab may revise these terms of service for its website at any time without notice. By using this website, 
                you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of The Netherlands and 
                you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
                <br />
                <a href="mailto:info@gamelab.fun" className="text-primary hover:underline">info@gamelab.fun</a>
              </p>
            </section>
          </div>
          
          <div className="mt-12 flex justify-center">
            <Link 
              href="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
