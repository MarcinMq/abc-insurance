from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from users.models import User, AgentProfile
from policies.models import Policy, InsuranceProduct


class Command(BaseCommand):
    help = 'Tworzy użytkowników demo oraz przykładowe wykupione polisy'

    def handle(self, *args, **options):
        # --- Użytkownicy demo ---
        klient, created = User.objects.get_or_create(
            username='klient',
            defaults=dict(
                email='klient@example.com',
                role='customer',
                first_name='Jan',
                last_name='Kowalski',
            ),
        )
        if created:
            klient.set_password('Haslo123!')
            klient.save()
            self.stdout.write('Utworzono użytkownika: klient')
        else:
            self.stdout.write('Użytkownik klient już istnieje')

        admin, created = User.objects.get_or_create(
            username='admin',
            defaults=dict(
                email='admin@example.com',
                role='admin',
                first_name='Adam',
                last_name='Admin',
                is_staff=True,
            ),
        )
        if created:
            admin.set_password('Haslo123!')
            admin.save()
            self.stdout.write('Utworzono użytkownika: admin')
        else:
            self.stdout.write('Użytkownik admin już istnieje')

        agent, created = User.objects.get_or_create(
            username='agent',
            defaults=dict(
                email='agent@example.com',
                role='agent',
                first_name='Anna',
                last_name='Nowak',
            ),
        )
        if created:
            agent.set_password('Haslo123!')
            agent.save()
            AgentProfile.objects.create(user=agent, license_number='AG001', department='Szkody')
            self.stdout.write('Utworzono użytkownika: agent')
        else:
            self.stdout.write('Użytkownik agent już istnieje')
            AgentProfile.objects.get_or_create(user=agent, defaults=dict(license_number='AG001', department='Szkody'))

        # --- Przykładowe polisy ---
        today = date.today()

        policies_data = [
            {
                'product_id': 1,  # OC Komunikacyjne
                'status': Policy.Status.ACTIVE,
                'coverage_amount': '1500000.00',
                'premium_monthly': '89.00',
                'start_date': today - timedelta(days=180),
                'end_date': today + timedelta(days=185),
                'insured_object': {
                    'make': 'Toyota',
                    'model': 'Corolla',
                    'year': 2019,
                    'registration': 'WA12345',
                    'vin': 'JT2BF22K1W0029483',
                },
                'notes': 'Polisa OC na samochód osobowy.',
            },
            {
                'product_id': 2,  # AC Auto Casco
                'status': Policy.Status.ACTIVE,
                'coverage_amount': '85000.00',
                'premium_monthly': '210.00',
                'start_date': today - timedelta(days=180),
                'end_date': today + timedelta(days=185),
                'insured_object': {
                    'make': 'Toyota',
                    'model': 'Corolla',
                    'year': 2019,
                    'registration': 'WA12345',
                    'vin': 'JT2BF22K1W0029483',
                    'value': 85000,
                },
                'notes': 'AC łączone z polisą OC.',
            },
            {
                'product_id': 3,  # Ubezpieczenie Nieruchomości
                'status': Policy.Status.ACTIVE,
                'coverage_amount': '450000.00',
                'premium_monthly': '95.00',
                'start_date': today - timedelta(days=365),
                'end_date': today + timedelta(days=365),
                'insured_object': {
                    'type': 'mieszkanie',
                    'address': 'ul. Kwiatowa 12/5, 00-001 Warszawa',
                    'area_m2': 68,
                    'floor': 3,
                    'year_built': 2005,
                },
                'notes': '',
            },
            {
                'product_id': 5,  # Ubezpieczenie na Życie
                'status': Policy.Status.ACTIVE,
                'coverage_amount': '300000.00',
                'premium_monthly': '220.00',
                'start_date': today - timedelta(days=730),
                'end_date': today + timedelta(days=635),
                'insured_object': {
                    'insured_person': 'Jan Kowalski',
                    'birth_date': '1985-04-22',
                    'beneficiary': 'Maria Kowalska',
                    'beneficiary_relation': 'małżonka',
                },
                'notes': 'Polisa życiowa z komponentem oszczędnościowym.',
            },
            {
                'product_id': 6,  # Ubezpieczenie Podróżne
                'status': Policy.Status.EXPIRED,
                'coverage_amount': '50000.00',
                'premium_monthly': '35.00',
                'start_date': today - timedelta(days=120),
                'end_date': today - timedelta(days=106),
                'insured_object': {
                    'destination': 'Włochy',
                    'trip_type': 'turystyczny',
                    'travelers': 2,
                },
                'notes': 'Wyjazd wakacyjny – lipiec 2025.',
            },
        ]

        created_count = 0
        for data in policies_data:
            product_id = data.pop('product_id')
            try:
                product = InsuranceProduct.objects.get(pk=product_id)
            except InsuranceProduct.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Produkt pk={product_id} nie istnieje – pomijam'))
                continue

            # Sprawdź czy polisa już istnieje (po kliencie + produkcie + dacie startu)
            exists = Policy.objects.filter(
                customer=klient,
                product=product,
                start_date=data['start_date'],
            ).exists()
            if exists:
                continue

            Policy.objects.create(
                customer=klient,
                product=product,
                assigned_agent=agent,
                **data,
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Dodano {created_count} przykładowych polis dla klienta demo'))
